export class RabbitMqHealthDto {
  connected!: boolean;
  bufferedEvents!: number;
  oldestBufferedMs!: number;
  lastPublishAttempt?: Date;
  message!:string;
}