import { BadRequestException, ParseIntPipe } from '@nestjs/common';

function generateParseIntPipe(name: string) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + ' 应该传数字');
    },
  });
}

export { generateParseIntPipe };
