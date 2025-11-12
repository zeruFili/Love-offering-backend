const joi = require('joi');

const signupSchema = {
  body: joi.object().keys({
    first_name: joi.string().min(1).required(),
    last_name: joi.string().min(1).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    phone_number: joi.string().required(),
  }),
};

const loginSchema = {
  body: joi.object().keys({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  }),
};

const forgotPasswordSchema = {
  body: joi.object().keys({
    email: joi.string().email().required(),
  }),
};

const resetPasswordSchema = {
  body: joi.object().keys({
   // Include token for password reset
    password: joi.string().min(6).required(),
  }),
};

const verifyEmailSchema = {
  body: joi.object().keys({
    code: joi.string().required(),
  }),
};

const updateUserProfileSchema = {
  body: joi.object().keys({
    first_name: joi.string().min(1),
    last_name: joi.string().min(1),
    email: joi.string().email(),
    phone_number: joi.string(),
  }).min(1), // At least one field must be provided
};

const deleteUserSchema = {
  params: joi.object().keys({
    userId: joi.string().required(), // Assuming userId is passed as a route parameter
  }),
};

const refreshTokenSchema = {
  body: joi.object().keys({
    refreshToken: joi.string().required(), // Expecting refresh token in the request body
  }),
};

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateUserProfileSchema,
  deleteUserSchema,
  refreshTokenSchema
};