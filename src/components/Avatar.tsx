import { User } from 'lucide-react';
import { cn } from '../lib/utils';

export function Avatar({ photo, className }: { photo?: string | null; className?: string }) {
  if (photo && photo.trim() !== '') {
    return <img src={`./fotos/${photo}`} alt="Avatar" className={cn("rounded-full object-cover bg-gray-200", className)} />;
  }
  return (
    <div className={cn("rounded-full bg-gray-200 flex items-center justify-center text-gray-500", className)}>
      <User className="w-1/2 h-1/2" />
    </div>
  );
}
