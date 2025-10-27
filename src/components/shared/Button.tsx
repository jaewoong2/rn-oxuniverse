import { PropsWithChildren } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
} from 'react-native';
import clsx from 'clsx';

interface ButtonProps extends PropsWithChildren<TouchableOpacityProps> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

/**
 * Button 컴포넌트
 * NativeWind className 기반 스타일링
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseClasses = 'rounded-lg items-center justify-center';

  const variantClasses = {
    primary: 'bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-200 active:bg-gray-300',
    outline: 'border border-gray-300 bg-transparent active:bg-gray-50',
    ghost: 'bg-transparent active:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-gray-900',
    outline: 'text-gray-700',
    ghost: 'text-blue-600',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const disabledClasses = 'opacity-50';

  return (
    <TouchableOpacity
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && disabledClasses,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : '#3b82f6'}
        />
      ) : typeof children === 'string' ? (
        <Text
          className={clsx(
            'font-semibold',
            textColorClasses[variant],
            textSizeClasses[size]
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
