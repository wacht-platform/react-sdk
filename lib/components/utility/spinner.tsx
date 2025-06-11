import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerWrapper = styled.div<{ $size?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: ${(props) => props.$size ? `${props.$size}px` : "100%"};
`;

const SpinnerCircle = styled.div<{ $size?: number }>`
  width: ${(props) => props.$size ? `${props.$size}px` : "40px"};
  height: ${(props) => props.$size ? `${props.$size}px` : "40px"};
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner = ({ size, className }: SpinnerProps) => {
  return (
    <SpinnerWrapper className={className} $size={size}>
      <SpinnerCircle $size={size} />
    </SpinnerWrapper>
  );
};
