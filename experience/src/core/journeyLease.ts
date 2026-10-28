// Every async completion must own the current interaction generation.
export class JourneyLease {
  private generation = 0;
  private active = false;
  begin() {
    this.active = true;
    return ++this.generation;
  }
  owns(token: number) {
    return this.active && token === this.generation;
  }
  cancel() {
    this.active = false;
    ++this.generation;
  }
  get running() {
    return this.active;
  }
}
