import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Formula PM 2.0
          </h1>
          <p className="text-gray-600">
            Construction Project Management System
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to Formula PM</CardTitle>
            <CardDescription>
              Streamline your construction projects with our comprehensive management platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/login" className="w-full">
              <Button className="w-full" size="lg">
                Login to Dashboard
              </Button>
            </Link>
            <p className="text-center text-sm text-gray-500">
              Sign in to access your projects and manage your construction workflow
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}