import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  size = 20,
  color,
}) => {
  const IconComponent = (Icons as Record<string, any>)[name] || Icons.CircleDollarSign;

  return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
};
