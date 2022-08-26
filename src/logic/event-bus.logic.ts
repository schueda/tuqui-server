export class EventBusService {

    constructor() { }

    private topics = new Map<string, Set<(data: any) => void>>();

    on(topic: string, callback: (data: any) => void) {
        this.subscribe(topic, callback);
    }

    emit(topic: string, data: any) {
        this.publish(topic, data);
    }

    private subscribe(topic: string, callback: (data: any) => void) {
        if (!this.topics.has(topic)) {
            this.topics.set(topic, new Set());
        }

        this.topics.get(topic).add(callback);
    }

    private publish(topic: string, data: any) {
        if (this.topics.has(topic)) {
            this.topics.get(topic).forEach(callback => {
                callback(data);
            }
            );
        }
    }

}