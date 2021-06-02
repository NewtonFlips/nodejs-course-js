const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  // let message = '';

  const errorFields = Object.values(err.errors).map(
    el => el.message
  );

  // if (err.errors.ratingsAverage) {
  //   message += err.errors.ratingsAverage.message;
  // } else if (err.errors.difficulty) {
  //   message += err.errors.difficulty.message;
  // }
  const message = `Invalid input data: ${errorFields.join(
    ' '
  )}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational errors, trusted
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown errors
    // 1. Log the error
    console.error('ERROR 💥', err);

    // Send a generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.kind === 'ObjectId')
      error = handleCastErrorDB(error);

    if (error.code === 11000)
      error = handleDuplicateFieldsDB(error);

    if (error._message === 'Validation failed')
      error = handleValidationErrorDB(error);
    // console.log(err.errors.difficulty.message);

    sendErrorProd(error, res);
  }
};
