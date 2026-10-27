import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';

export interface SubmitEnvelopeDto {
  conversationId: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  ciphertext: string;
  nonce: string;
  keyVersion: number;
}

@Controller('v1/conversations')
export class MessagesController {
  @Post(':conversationId/messages')
  async submitEnvelope(
    @Param('conversationId') conversationId: string,
    @Body() dto: SubmitEnvelopeDto,
  ) {
    return {
      messageId: `msg_${Date.now()}`,
      conversationId,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };
  }

  @Get(':conversationId/messages')
  async getEnvelopes(
    @Param('conversationId') conversationId: string,
    @Query('since') since?: string,
  ) {
    return {
      conversationId,
      envelopes: [],
    };
  }
}
