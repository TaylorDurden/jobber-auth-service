import crypto from 'crypto';

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, IEmailMessageDetails } from '@taylordurden/jobber-shared';
import { config } from '@auth/config';
import {
  getAuthUserByPasswordToken,
  getUserByEmail,
  getUserByUsername,
  updatePassword,
  updatePasswordToken
} from '@auth/services/auth.service';
import { changePasswordSchema, emailSchema, resetPasswordSchema } from '@auth/schemes/password';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { AuthModel } from '@auth/models/auth.schema';

const controllerMsg = 'AuthService password controller';

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { error } = await emailSchema.validateAsync(req.body);
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, `${controllerMsg} forgotPassword() method error`);
  }
  const { email } = req.body;
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    throw new BadRequestError('Invalid credentials', `${controllerMsg} forgotPassword() method error`);
  }

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  const date: Date = new Date();
  date.setHours(date.getHours() + 1);
  await updatePasswordToken(existingUser.id!, randomCharacters, date);
  const resetLink = `${config.CLIENT_URL}/reset_password?token=${randomCharacters}`;
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: existingUser.email,
    resetLink,
    username: existingUser.username,
    template: 'forgotPassword'
  };
  // notification service consume this and send forgotPassword email
  await publishDirectMessage(
    authChannel,
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Forgot password message sent to notification service.'
  );
  res.status(StatusCodes.OK).json({ message: 'Password reset email sent.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { error } = await resetPasswordSchema.validateAsync(req.body);
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, `${controllerMsg} resetPassword() method error`);
  }
  const { password, confirmPassword } = req.body;
  const { token } = req.params;
  if (password !== confirmPassword) {
    throw new BadRequestError('Passwords do not match', `${controllerMsg} resetPassword() method error`);
  }

  const existingUser = await getAuthUserByPasswordToken(token);
  if (!existingUser) {
    throw new BadRequestError('Reset token has expired', `${controllerMsg} resetPassword() method error`);
  }
  const hashedPassword: string = await AuthModel.prototype.hashPassword(password);
  await updatePassword(existingUser.id!, hashedPassword);
  const messageDetails: IEmailMessageDetails = {
    username: existingUser.username,
    template: 'resetPasswordSuccess'
  };
  await publishDirectMessage(
    authChannel,
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Reset password success message sent to notification service.'
  );
  res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { error } = await changePasswordSchema.validateAsync(req.body);
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, `${controllerMsg} changePassword() method error`);
  }
  const { newPassword } = req.body;

  const existingUser = await getUserByUsername(`${req.currentUser?.username}`);
  if (!existingUser) {
    throw new BadRequestError('Invalid username', `${controllerMsg} changePassword() method error`);
  }
  const hashedPassword: string = await AuthModel.prototype.hashPassword(newPassword);
  await updatePassword(existingUser.id!, hashedPassword);
  const messageDetails: IEmailMessageDetails = {
    username: existingUser.username,
    template: 'resetPasswordSuccess'
  };
  await publishDirectMessage(
    authChannel,
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Password change success message sent to notification service.'
  );
  res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
}
