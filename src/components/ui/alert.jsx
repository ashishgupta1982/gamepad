import React from 'react';

const Alert = ({ className, variant = "default", icon, ...props }) => {
  const variantStyles = {
    default: "bg-background text-foreground border-gray-200",
    primary: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200", 
    destructive: "bg-red-50 text-red-800 border-red-200"
  };

  return (
    <div
      role="alert"
      className={`
        relative w-full rounded-lg border p-4 shadow-sm
        transition-all duration-200
        ${icon ? '[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground' : ''}
        ${variantStyles[variant] || variantStyles.default} 
        ${className}
      `}
      {...props}
    />
  );
};
Alert.displayName = "Alert";

const AlertTitle = ({ className, ...props }) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props} />
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = ({ className, ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props} />
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };