import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Service } from "typedi";
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../app/errors';

@Service()
@Middleware({ type: "after" })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, request: Request, response: Response, next: NextFunction) {
    // Handle custom application errors
    if (error instanceof NotFoundError) {
      return response.status(error.statusCode || 404).json({
        message: error.message,
        success: false,
      });
    }

    if (error instanceof UnauthorizedError) {
      return response.status(error.statusCode || 401).json({
        message: error.message,
        success: false,
      });
    }

    if (error instanceof BadRequestError) {
      return response.status(error.statusCode || 400).json({
        message: error.message,
        success: false,
      });
    }

    // Handle class-validator errors
    if (error.httpCode === 400 && error.errors && Array.isArray(error.errors)) {
      const validationErrors = error.errors.map((err: ValidationError) => ({
        property: err.property,
        constraints: err.constraints,
        children: err.children,
      }));

      return response.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
        success: false,
      });
    }

    // Handle other routing-controllers errors
    if (error.httpCode) {
      return response.status(error.httpCode).json({
        message: error.message || "An error occurred",
        success: false,
      });
    }

    // Log unexpected errors
    console.error("Unhandled error:", error);

    // Default error response
    return response.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
}
