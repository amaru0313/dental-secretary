
import React from 'react';

interface PageTitleProps {
  title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  return (
    <h1 className="text-2xl font-semibold text-gray-800">
      {title}
    </h1>
  );
};

export default PageTitle;
