import { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';
import clsx from 'clsx';

interface CardProps extends PropsWithChildren<ViewProps> {
  variant?: 'default' | 'outlined' | 'elevated';
  className?: string;
}

/**
 * Card 컴포넌트
 * 웹앱의 Card 컴포넌트와 동일한 props 구조
 */
export function Card({
  children,
  variant = 'default',
  className,
  ...props
}: CardProps) {
  const baseClasses = 'rounded-lg p-4';

  const variantClasses = {
    default: 'bg-white',
    outlined: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md',
  };

  return (
    <View
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </View>
  );
}
