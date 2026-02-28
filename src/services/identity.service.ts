import { PrismaClient, Contact, Precedence } from "../generated/prisma/client";

const prisma = new PrismaClient();

export const identifyService = async (
  email?: string | null,
  phoneNumber?: string | null
) => {
  if (!email && !phoneNumber) {
    throw new Error("At least one identifier required");
  }

  const OR: any[] = [];

  if (email) OR.push({ email });
  if (phoneNumber) OR.push({ phoneNumber });

  const matches = await prisma.contact.findMany({
    where: { OR },
    orderBy: { createdAt: "asc" },
  });

  if (matches.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: Precedence.primary,
      },
    });

    return buildResponse([newContact]);
  }

  const primaryIds = new Set<number>();

  for (const c of matches) {
    if (c.linkPrecedence === Precedence.primary) {
      primaryIds.add(c.id);
    } else if (c.linkedId) {
      primaryIds.add(c.linkedId);
    }
  }

  let primaryList = await prisma.contact.findMany({
    where: { id: { in: [...primaryIds] } },
    orderBy: { createdAt: "asc" },
  });


  //  Case 1: Multiple primary contacts - we need to merge them under the oldest one and update the rest to point to it.
  //  Case 2: No primary contacts - we can treat the oldest secondary as primary and update the rest to point to it. We need to fetch the primary contact from the secondary's linkedId field. This is a data integrity issue that ideally shouldn't happen, but we can handle it gracefully.
  // Case 3: Normal case - we have a single primary contact and we can just add the new contact as secondary if it doesn't already exist.

  let oldestPrimary = primaryList[0] || matches[0];

  if(oldestPrimary.linkPrecedence === Precedence.secondary){
    const linkedPrimary = await prisma.contact.findUnique({
      where: { id: oldestPrimary.linkedId! },
    });

    if(linkedPrimary){
      oldestPrimary = linkedPrimary;
    }
  }

  // To handle case 1
  if (primaryList.length > 1) {
    const others = primaryList.slice(1);

    await prisma.contact.updateMany({
      where: {
        id: { in: others.map(c => c.id) },
      },
      data: {
        linkPrecedence: Precedence.secondary,
        linkedId: oldestPrimary.id,
      },
    });

    // This is to handle any contacts that were linked to the now secondary primaries - we need to update them to point to the oldest primary as well.
    await prisma.contact.updateMany({
      where: {
        linkedId: { in: others.map(c => c.id) },
      },
      data: {
        linkedId: oldestPrimary.id,
      },
    });

    const mergedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: oldestPrimary.id },
          { linkedId: oldestPrimary.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return buildResponse(mergedContacts);
  }

  let alreadyExists;

  if(!email){
    alreadyExists = matches.some((c: Contact) => c.phoneNumber === phoneNumber);
  }else if(!phoneNumber){
    alreadyExists = matches.some((c: Contact) => c.email === email);
  }else{
    alreadyExists = matches.some(
      (c: Contact) =>
        (c.email === email) &&
        (c.phoneNumber === phoneNumber)
    );
  }

  if (!alreadyExists) {
    await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: oldestPrimary.id,
        linkPrecedence: Precedence.secondary,
      },
    });
  }

  const allContacts = await prisma.contact.findMany({
    where: {
      OR: [{ id: oldestPrimary.id }, { linkedId: oldestPrimary.id }],
    },
    orderBy: { createdAt: "asc" },
  });

  return buildResponse(allContacts);
};

function buildResponse(contacts: Contact[]) {
  const primary = contacts.find(
    (c) => c.linkPrecedence === "primary"
  );

  const emails = [...new Set(contacts.map((c) => c.email).filter(Boolean))];
  const phones = [
    ...new Set(contacts.map((c) => c.phoneNumber).filter(Boolean)),
  ];

  const secondaryIds = contacts
    .filter((c) => c.linkPrecedence === "secondary")
    .map((c) => c.id);

  return {
    contact: {
      primaryContactId: primary?.id || null,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaryIds,
    },
  };
}