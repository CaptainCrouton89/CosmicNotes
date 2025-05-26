import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  BrainIcon, 
  SearchIcon, 
  TagIcon, 
  MessageSquareIcon, 
  FolderIcon, 
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Cosmic Notes</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Stop Note Chaos Forever
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn chaos into <span className="text-blue-600">clarity</span>. Instantly.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Stop drowning in scattered notes. Cosmic Notes uses AI to transform your random thoughts into an organized knowledge system—automatically. Find any idea in seconds, not hours.
          </p>
          <div className="flex justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-3">
                Transform My Notes
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Stop wasting time searching for your ideas
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                AI does the heavy lifting. You focus on what matters—thinking, creating, and building on your best ideas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <BrainIcon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Zero-Effort Organization</h3>
                <p className="text-gray-600">
                  AI tags everything instantly. No manual sorting, no forgotten notes. Your ideas organize themselves.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <SearchIcon className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Anything in Seconds</h3>
                <p className="text-gray-600">
                  Search by concept, not keywords. Remember writing about "productivity"? Find it even if you called it "getting stuff done."
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <FolderIcon className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Categorization</h3>
                <p className="text-gray-600">
                  Work notes, personal thoughts, project ideas—AI sorts them automatically. No folders, no confusion.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <MessageSquareIcon className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Talk to Your Notes</h3>
                <p className="text-gray-600">
                  "What did I learn about React last month?" Ask your notes anything. Get instant, intelligent answers.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <TagIcon className="w-12 h-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Self-Cleaning System</h3>
                <p className="text-gray-600">
                  No tag chaos. AI merges duplicates and maintains clean organization automatically. Set it and forget it.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <SparklesIcon className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover Hidden Connections</h3>
                <p className="text-gray-600">
                  AI reveals patterns you missed. See how your ideas connect across months of notes. Unlock breakthrough insights.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  The note-taking app that actually works
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckIcon className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Zero ideas lost, ever</h3>
                      <p className="text-gray-600">AI makes every thought instantly findable. No more "I know I wrote that down somewhere."</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckIcon className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Unlock hidden insights</h3>
                      <p className="text-gray-600">AI reveals connections between ideas you wrote months apart. Turn scattered thoughts into breakthrough moments.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckIcon className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Stop organizing, start creating</h3>
                      <p className="text-gray-600">AI handles all the tedious filing. You focus on what matters—capturing and developing your best ideas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckIcon className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">One system, every context</h3>
                      <p className="text-gray-600">Work projects, personal thoughts, learning notes—all searchable in one place without the mess.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="flex gap-2 mt-4">
                      <Badge variant="secondary" className="text-xs">AI Suggested</Badge>
                      <Badge variant="outline" className="text-xs">productivity</Badge>
                      <Badge variant="outline" className="text-xs">ideas</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stop losing your best ideas
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join the thousands who've transformed chaotic notes into organized knowledge systems. Your future self will thank you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  Start Organizing Now
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 Cosmic Notes. Built with AI for better thinking.</p>
        </div>
      </footer>
    </div>
  );
}