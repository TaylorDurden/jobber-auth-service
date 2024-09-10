import { AuthModel } from '@auth/models/auth.schema';
import { loginSchema } from '@auth/schemes/signin';
import { getUserByEmail, getUserByUsername, signToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, isEmail } from '@taylordurden/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { omit } from 'lodash';
// import { publishDirectMessage } from '@auth/queues/auth.producer';
// import { authChannel } from '@auth/server';

export async function signIn(req: Request, res: Response): Promise<void> {
  const { error } = await Promise.resolve(loginSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'signin controller signIn() method error');
  }
  const { username, password } = req.body;
  const isValidEmail: boolean = isEmail(username);
  const existingUser: IAuthDocument | undefined = !isValidEmail ? await getUserByUsername(username) : await getUserByEmail(username);
  if (!existingUser) {
    throw new BadRequestError('Invalid credentials', 'signin controller signIn() method error');
  }
  const passwordsMatch: boolean = await AuthModel.prototype.comparePassword(password, `${existingUser.password}`);
  if (!passwordsMatch) {
    throw new BadRequestError('Invalid credentials', 'signin controller signIn() method error');
  }
  const message = 'User login successfully';
  const userJWT = signToken(existingUser.id!, existingUser.email!, existingUser.username!);
  const userData = omit(existingUser, ['password']);
  res.status(StatusCodes.OK).json({ message, user: userData, token: userJWT });
}
