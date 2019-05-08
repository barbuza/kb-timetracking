import { flattenEventStream } from './flatten';
import { reduce } from './reduce';
import { IAppEvent } from './utils';

interface IInput {
  events: IAppEvent[];
  ttl: number;
  currentTime: number;
}

process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    buffer += chunk;
  }
});

process.stdin.on('end', () => {
  const input = JSON.parse(buffer) as IInput;
  const result = reduce(flattenEventStream(input.events, input.ttl, input.currentTime));
  process.stdout.write(JSON.stringify(result));
});
