export type Message = {
    type: string;
    content: any;
    category: 'connection' | 'matchmaking' | 'game' | 'meeting';
}