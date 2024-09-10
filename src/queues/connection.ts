import { config } from '@auth/config';
import { getLogger } from '@auth/helpers';
import client, { Channel, Connection } from 'amqplib';

const log = getLogger('authQueueConnection', 'debug');

async function createConnectionMQ(): Promise<Channel | undefined> {
  try {
    const connection: Connection = await client.connect(`${config.RABBITMQ_ENDPOINT}`);
    const channel: Channel = await connection.createChannel();
    log.info('Auth server connected to queue successfully...');
    closeConnectionMQ(channel, connection);
    return channel;
  } catch (error) {
    log.log('error', 'AuthService createConnection() method error:', error);
    return undefined;
  }
}

function closeConnectionMQ(channel: Channel, connection: Connection): void {
  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });
}

export { createConnectionMQ };
