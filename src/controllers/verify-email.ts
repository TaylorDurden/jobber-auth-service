import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@taylordurden/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body;
  const userExisted: IAuthDocument | undefined = await getAuthUserByVerificationToken(token);
  if (!userExisted) {
    throw new BadRequestError(
      'Verification token is either invalid or already used.',
      'verify-email controller verifyEmail() method error'
    );
  }
  await updateVerifyEmailField(userExisted.id!, 1, undefined);
  const updatedUser = await getAuthUserById(userExisted.id!);
  res.status(StatusCodes.OK).json({ message: 'Email verified successfully.', user: updatedUser });
}
