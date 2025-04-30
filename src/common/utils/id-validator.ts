import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Validates the format of a MongoDB ObjectId.
 * @param id - the ID to validate.
 * @param scope - the name of the ID field for error messaging.
 * @throws BadRequestException if the ID is not valid.
 */
export function validateId(id: string, scope: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ${scope} ID format.`);
  }
}

/**
 * Checks if the user has the admin role.
 * @param user - the user object from the request.
 * @throws ForbiddenException if the user is not an admin.
 */
export function checkAdmin(user: { role?: string }): void {
  if (user?.role !== 'admin') {
    throw new ForbiddenException('Access denied. Admins only.');
  }
}
