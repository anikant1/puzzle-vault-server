import { Controller, Get, Post, Body, Param } from '@nestjs/common';

export interface PublishKeyBundleDto {
  deviceId: string;
  identityKey: string;
  signedPrekey: string;
  signature: string;
  oneTimePrekeys: Array<{ keyId: number; publicKey: string }>;
}

@Controller('v1/keys')
export class KeyDirectoryController {
  @Post('bundle')
  async publishBundle(@Body() dto: PublishKeyBundleDto) {
    return {
      success: true,
      deviceId: dto.deviceId,
      message: 'Cryptographic PreKey bundle published to directory.',
    };
  }

  @Get('bundle/:deviceId')
  async fetchBundle(@Param('deviceId') deviceId: string) {
    return {
      deviceId,
      identityKey: 'MOCK_IDENTITY_KEY',
      signedPrekey: 'MOCK_SIGNED_PREKEY',
      signature: 'MOCK_SIGNATURE',
      oneTimePrekey: {
        keyId: 101,
        publicKey: 'MOCK_ONE_TIME_PREKEY',
      },
    };
  }
}
