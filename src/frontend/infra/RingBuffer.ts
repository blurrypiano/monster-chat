export default class RingBuffer<T> {
  private buffer: T[];
  private readIndex: number;
  private writeIndex: number;

  constructor(capacity: number) {
    this.buffer = new Array(capacity);
    this.readIndex = 0;
    this.writeIndex = 0;
  }

  public isEmpty(): boolean {
    return this.readIndex === this.writeIndex;
  }

  public isFull(): boolean {
    return (this.writeIndex + 1) % this.buffer.length === this.readIndex;
  }

  public push(value: T): void {
    if (this.isFull()) {
      throw new Error('Buffer is full');
    }

    this.buffer[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
  }

  public pop(): T {
    if (this.isEmpty()) {
      throw new Error('Buffer is empty');
    }

    const value = this.buffer[this.readIndex];
    this.readIndex = (this.readIndex + 1) % this.buffer.length;
    return value;
  }

  public peek(): T {
    if (this.isEmpty()) {
      throw new Error('Buffer is empty');
    }

    return this.buffer[this.readIndex];
  }

  public clear(): void {
    this.readIndex = 0;
    this.writeIndex = 0;
  }

  public get capacity(): number {
    return this.buffer.length;
  }

  public get size(): number {
    if (this.writeIndex >= this.readIndex) {
      return this.writeIndex - this.readIndex;
    }

    return this.buffer.length - this.readIndex + this.writeIndex;
  }
}
