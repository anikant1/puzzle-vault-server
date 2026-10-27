import { Module } from '@nestjs/common';
import { KeyDirectoryController } from './key-directory/key-directory.controller';
import { MessagesController } from './messages/messages.controller';
import { RealtimeGateway } from './realtime/realtime.gateway';

@Module({
  imports: [],
  controllers: [KeyDirectoryController, MessagesController],
  providers: [RealtimeGateway],
})
export class AppModule {}
