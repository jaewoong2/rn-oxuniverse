import { PropsWithChildren } from 'react';
import { View, Text, ViewProps } from 'react-native';
import clsx from 'clsx';

interface BadgeProps extends PropsWithChildren<ViewProps> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge 컴포넌트
 * 상태 표시, 라벨 등에 사용
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  const baseClasses = 'rounded-full px-2 py-1 items-center justify-center';

  const variantClasses = {
    default: 'bg-gray-100',
    success: 'bg-green-100',
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100',
  };

  const textColorClasses = {
    default: 'text-gray-700',
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700',
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <View
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          className={clsx(
            'font-medium',
            textColorClasses[variant],
            sizeClasses[size]
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
