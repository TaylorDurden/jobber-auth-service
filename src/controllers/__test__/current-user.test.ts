import { Request, Response } from 'express';
import { authMock, authMockRequest, authMockResponse, authUserPayload } from '@auth/controllers/__test__/mocks/auth.mock';
import { getCurrentUser, resendEmail } from '@auth/controllers/current-user';
import * as auth from '@auth/services/auth.service';
import * as helper from '@taylordurden/jobber-shared';
import { Sequelize } from 'sequelize';

jest.mock('@taylordurden/jobber-shared');
jest.mock('@auth/services/auth.service');
jest.mock('@auth/queues/auth.producer');
jest.mock('@elastic/elasticsearch');

const USERNAME = 'Taylor';
const PASSWORD = '123456';

let mockConnection: Sequelize;

describe('CurrentUser', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
    // ReferenceError: You are trying to `import` a file after the Jest environment has been torn down.
    // this is fixing the above error caused by sync function
    mockConnection = new Sequelize(process.env.MYSQL_DB!, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        multipleStatements: true
      }
    });
    await mockConnection.sync({ force: true });
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await mockConnection.close();
  });

  describe('getCurrentUser method', () => {
    it('should return authenticated user', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue(authMock);
      await getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authenticated user',
        user: authMock
      });
    });
    it('should return empty user', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue({} as never);
      await getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authenticated user',
        user: null
      });
    });
  });
  describe('resendEmail method', () => {
    it('should call BadRequestError for invalid email', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue({} as never);

      resendEmail(req, res).catch(() => {
        expect(helper.BadRequestError).toHaveBeenCalledWith('Email is invalid', 'CurrentUser resentEmail() method error');
      });
    });

    it('should call updateVerifyEmailField method', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue(authMock);

      await resendEmail(req, res);
      expect(auth.updateVerifyEmailField).toHaveBeenCalled();
    });

    it('should return authenticated user', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue(authMock);
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue(authMock);

      await resendEmail(req, res);
      expect(auth.updateVerifyEmailField).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email verification sent',
        user: authMock
      });
    });
  });
});
