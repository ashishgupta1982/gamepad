import React from 'react';

const Button = React.forwardRef(({ className, children, variant = "default", size = "default", ...props }, ref) => {
  // Button variants with proper Tailwind classes and custom styles
  const variantStyles = {
    default: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200",
    outline: "bg-white border-2 border-gray-200 text-gray-700 font-medium shadow-sm hover:shadow-md hover:border-gray-300 hover:bg-gray-50 transition-all duration-200",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 font-medium shadow-sm hover:shadow-md transition-all duration-200",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium transition-all duration-200",
    link: "text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline font-medium transition-all duration-200",
    destructive: "bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200",
    success: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200",
    gradient: "btn-primary", // Use the custom gradient style from globals.css
  };

  // Button sizes
  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 py-1 text-xs",
    lg: "h-12 px-6 py-3 text-base",
    icon: "h-10 w-10 p-0",
  };

  // Combine all classes with proper precedence
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variantClass = variantStyles[variant] || variantStyles.default;
  const sizeClass = sizeStyles[size] || sizeStyles.default;
  
  // Use clsx or a simple join to ensure proper class ordering
  const combinedClasses = [baseClasses, variantClass, sizeClass, className].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
export { Button };