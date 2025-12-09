import { FileUp, Shield, Zap, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';

export default function Landing() {
  const { resolvedTheme } = useTheme();
  
  return (
    <Layout>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <img src={resolvedTheme === 'dark' ? '/achu-logo-dark.png' : '/achu-logo.png'} alt="Achu's SFTP" className="h-16 sm:h-20" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent px-2">
            Secure File Transfer & Storage
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            Achu's SFTP provides enterprise-grade cloud storage with seamless file management,
            secure sharing, and real-time collaboration.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Button size="lg" asChild data-testid="get-started" className="w-full sm:w-auto min-w-40">
              <a href="/login">
                Get Started
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto min-w-40">
              <a href="#features">
                Learn More
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 px-2">
            Everything you need for secure file management
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-card rounded-lg p-6 border border-card-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <FileUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop files or browse to upload. Support for bulk uploads and all file types.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-card-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Storage</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade security with encrypted storage and role-based access control.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-card-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Access</h3>
              <p className="text-sm text-muted-foreground">
                Lightning-fast file operations with real-time sync and instant search.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-card-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Generate secure share links with expiration dates and download limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-card rounded-2xl p-6 sm:p-10 lg:p-12 border border-card-border">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to get started?</h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
            Join thousands of users who trust Achu's SFTP for their file storage needs.
          </p>
          <Button size="lg" asChild className="w-full sm:w-auto">
            <a href="/login" data-testid="cta-button">
              Start using Achu's SFTP
            </a>
          </Button>
        </div>
      </section>

    </Layout>
  );
}
