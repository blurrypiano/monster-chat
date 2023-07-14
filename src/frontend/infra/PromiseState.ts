interface PendingState {
  status: "pending";
}

interface FulfilledState<T> {
  status: "fulfilled";
  value: T;
}

interface RejectedState {
  status: "rejected";
  reason: any;
}

export type PromiseState<T> = PendingState | FulfilledState<T> | RejectedState;

export default async function promiseState<T>(
  promise: Promise<T>,
): Promise<PromiseState<T>> {
  const pendingState: PendingState = { status: "pending" };

  try {
    const result = await Promise.race([promise, pendingState]);
    return result === pendingState ? pendingState : { status: "fulfilled", value: result } as FulfilledState<T>;
  } catch (error) {
    return { status: "rejected", reason: error } as RejectedState;
  }
}
