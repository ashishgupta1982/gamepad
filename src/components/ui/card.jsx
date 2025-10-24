import React from 'react';

const Card = ({ className, hover = false, ...props }) => (
  <div 
    className={`
      rounded-lg border bg-card text-card-foreground shadow-sm 
      ${hover ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5' : ''}
      ${className}
    `} 
    {...props} 
  />
);
Card.displayName = "Card";

const CardHeader = ({ className, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);
CardHeader.displayName = "CardHeader";

const CardTitle = ({ className, ...props }) => (
  <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`} {...props} />
);
CardTitle.displayName = "CardTitle";

const CardDescription = ({ className, ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props} />
);
CardDescription.displayName = "CardDescription";

const CardContent = ({ className, ...props }) => (
  <div className={`p-6 ${className}`} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = ({ className, ...props }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };