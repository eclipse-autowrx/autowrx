export type Props<Component extends (...args: any[]) => React.ReactNode> = Parameters<Component>[0];
