interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner = ({ size, className }: SpinnerProps) => {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: size ? `${size}px` : "100%",
      }}
    >
      <span
        className="w-spin"
        style={{ width: size ?? 40, height: size ?? 40 }}
      />
    </div>
  );
};
