import { Request, Response } from "express";
import { identifyService } from "../services/identity.service";
import { identifySchema } from "../validators/identify.validator";

export const identifyController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = identifySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const { email, phoneNumber } = parsed.data;

    const result = await identifyService(email, phoneNumber);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};