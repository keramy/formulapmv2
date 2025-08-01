/**
 * Realtime Status Header Component - PERFORMANCE OPTIMIZATION
 * 
 * Extracted from RealtimeScopeListTab for better code splitting
 * and maintainability
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Users from 'lucide-react/dist/esm/icons/users';

interface RealtimeStatusHeaderProps {
  isConnected: boolean;
  recentUpdates: string[];
  onlineUsers: Array<{
    userId: string;
    userName: string;
  }>;
}

export function RealtimeStatusHeader({
  isConnected,
  recentUpdates,
  onlineUsers
}: RealtimeStatusHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Live Updates Active' : 'Offline'}
          </span>
          <Zap className="w-4 h-4 text-blue-500" />
        </div>
        {recentUpdates.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {recentUpdates.length} recent updates
          </Badge>
        )}
      </div>
      
      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{onlineUsers.length} online</span>
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 3).map((user) => (
              <Avatar key={user.userId} className="w-6 h-6 border-2 border-white">
                <AvatarFallback className="text-xs">
                  {user.userName.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}