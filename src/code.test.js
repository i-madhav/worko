import { RegisterUser, LoginUser, LogOutUser } from './controller/user.controller.js';
import { User } from '../models/user.modal.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validateObject } from '../utils/validate.js';
import { generateAccessAndRefreshToken } from './controller/user.controller.js';

// Mock dependencies
jest.mock('../models/user.modal.js');
jest.mock('../utils/apiError.js');
jest.mock('../utils/apiResponse.js');
jest.mock('../utils/validate.js');
jest.mock('./your-file-path', () => ({
  ...jest.requireActual('./controller/user.controller.js'),
  generateAccessAndRefreshToken: jest.fn(),
}));

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: 'mockUserId' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('RegisterUser', () => {
    it('should register a new user successfully', async () => {
      validateObject.mockReturnValue({ success: true });
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: 'mockUserId' });
      User.findById.mockResolvedValue({ _id: 'mockUserId', name: 'Test User' });

      req.body = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        city: 'Test City',
        zipcode: '12345',
        password: 'password123',
      };

      await RegisterUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(ApiResponse));
    });

    it('should throw an error if validation fails', async () => {
      validateObject.mockReturnValue({ success: false });

      await expect(RegisterUser(req, res, next)).rejects.toThrow(ApiError);
    });

    it('should throw an error if user already exists', async () => {
      validateObject.mockReturnValue({ success: true });
      User.findOne.mockResolvedValue({ _id: 'existingUserId' });

      await expect(RegisterUser(req, res, next)).rejects.toThrow(ApiError);
    });
  });

  describe('LoginUser', () => {
    it('should login user successfully', async () => {
      validateObject.mockReturnValue({ success: true });
      User.findOne.mockResolvedValue({
        _id: 'mockUserId',
        isPasswordValid: jest.fn().mockResolvedValue(true),
      });
      generateAccessAndRefreshToken.mockResolvedValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });

      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await LoginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(expect.any(ApiResponse));
    });

    it('should throw an error if validation fails', async () => {
      validateObject.mockReturnValue({ success: false });

      await expect(LoginUser(req, res, next)).rejects.toThrow(ApiError);
    });

    it('should throw an error if user is not found', async () => {
      validateObject.mockReturnValue({ success: true });
      User.findOne.mockResolvedValue(null);

      await expect(LoginUser(req, res, next)).rejects.toThrow(ApiError);
    });

    it('should throw an error if password is invalid', async () => {
      validateObject.mockReturnValue({ success: true });
      User.findOne.mockResolvedValue({
        _id: 'mockUserId',
        isPasswordValid: jest.fn().mockResolvedValue(false),
      });

      await expect(LoginUser(req, res, next)).rejects.toThrow(ApiError);
    });
  });

  describe('LogOutUser', () => {
    it('should logout user successfully', async () => {
      User.findByIdAndUpdate.mockResolvedValue({});

      await LogOutUser(req, res, next);

      expect(User.findByIdAndUpdatee).toHaveBeenCalledWith(
        'mockUserId',
        { $unset: { refreshToken: 1 } },
        { new: true }
      );
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(ApiResponse));
    });
  });
});