import { ArrowLeft, ChevronDown, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface FaqItem {
  question: string
  answer: string | React.ReactElement
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqSections: { title: string; items: FaqItem[] }[] = [
    {
      title: 'Getting Started',
      items: [
        {
          question: 'What is AI Dev Request Platform?',
          answer: 'AI Dev Request Platform is an AI-powered development platform that enables you to build software using natural language. Simply describe what you want to build, and our AI (powered by Claude) will analyze your requirements, propose a solution, and generate production-ready code.',
        },
        {
          question: 'How do I get started?',
          answer: (
            <>
              Getting started is easy:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Create a free account using email or OAuth (Google/GitHub)</li>
                <li>Describe your project in natural language</li>
                <li>Review the AI-generated proposal and technical specifications</li>
                <li>Approve the plan and let AI generate your code</li>
                <li>Deploy your project to the cloud with one click</li>
              </ol>
            </>
          ),
        },
        {
          question: 'Do I need coding experience?',
          answer: 'No coding experience is required to use the platform! However, developers can benefit from advanced features like code review, refinement, and custom specifications. The platform is designed for both technical and non-technical users.',
        },
        {
          question: 'What types of projects can I build?',
          answer: 'You can build web applications (React, Vue, Angular), backend APIs (.NET, Node.js), mobile apps, landing pages, admin dashboards, and more. The platform supports multiple frameworks and technology stacks.',
        },
      ],
    },
    {
      title: 'Pricing and Billing',
      items: [
        {
          question: 'How does pricing work?',
          answer: 'We use a credit-based system. Credits are consumed when generating code, deploying projects, and using advanced features. You can purchase credit packages or subscribe to monthly plans with included credits. Check our pricing page for current rates.',
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through Stripe. Cryptocurrency payments may be available for enterprise plans.',
        },
        {
          question: 'Can I get a refund?',
          answer: 'Credits are generally non-refundable. However, we may issue refunds in cases of service outages, billing errors, or at our discretion. Contact support@aidevrequest.com for refund requests.',
        },
        {
          question: 'Do unused credits expire?',
          answer: 'Credit expiration depends on your plan. One-time credit purchases typically expire after 12 months of inactivity, while subscription plans include monthly credits that reset each billing cycle.',
        },
      ],
    },
    {
      title: 'AI and Code Generation',
      items: [
        {
          question: 'Which AI models do you use?',
          answer: 'We primarily use Anthropic Claude API (Claude Opus 4.6 and Sonnet 4.5). Our intelligent model routing system automatically selects the best model for your task, balancing quality, speed, and cost.',
        },
        {
          question: 'How accurate is the AI-generated code?',
          answer: 'Our AI generates production-quality code with built-in best practices, security scanning, and automated testing. However, we recommend reviewing generated code before deployment. We also offer AI code review and self-healing features to catch and fix issues.',
        },
        {
          question: 'Can I modify the generated code?',
          answer: 'Yes! You own the generated code and can modify it freely. The platform supports iterative refinement where you can request changes in natural language, and incremental code regeneration to preserve your custom modifications.',
        },
        {
          question: 'What if the AI makes a mistake?',
          answer: 'Our platform includes compiler validation, automated testing, and self-healing capabilities to catch errors. If you find an issue, you can use the refinement feature to request corrections, or contact support for assistance.',
        },
      ],
    },
    {
      title: 'Deployment and Hosting',
      items: [
        {
          question: 'Where are projects hosted?',
          answer: 'Projects are deployed to Microsoft Azure using Container Apps and Static Web Apps. We provide automatic scaling, HTTPS, and global CDN for optimal performance.',
        },
        {
          question: 'Can I use my own domain?',
          answer: 'Yes! You can connect custom domains to your deployed projects. Domain management and SSL certificates are handled automatically through the platform.',
        },
        {
          question: 'What hosting plans are available?',
          answer: 'We offer Free, Starter, Pro, and Enterprise hosting plans with varying resource limits, bandwidth, and features. All plans include automatic scaling and HTTPS.',
        },
        {
          question: 'Can I export my code and host elsewhere?',
          answer: 'Absolutely! You can export your generated code at any time and deploy it to your own infrastructure. We provide Docker containerization for easy deployment to any cloud provider.',
        },
      ],
    },
    {
      title: 'Security and Privacy',
      items: [
        {
          question: 'Is my code and data secure?',
          answer: 'Yes. We implement industry-standard security practices including encryption at rest and in transit, regular security audits, secret detection, and OAuth compliance. Your data is stored in secure Azure data centers.',
        },
        {
          question: 'Who owns the generated code?',
          answer: 'You retain full ownership of all code generated through your requests. We do not claim any intellectual property rights to your projects.',
        },
        {
          question: 'Do you use my code to train AI models?',
          answer: 'We may use anonymized, aggregated data to improve our platform, but we do not use your proprietary code or personally identifiable information for training without explicit consent. You can opt out of data collection by contacting us.',
        },
        {
          question: 'Are you GDPR and CCPA compliant?',
          answer: 'Yes, we comply with GDPR, CCPA, and other data protection regulations. You can exercise your rights to access, correct, or delete your data through your account settings or by contacting privacy@aidevrequest.com.',
        },
      ],
    },
    {
      title: 'Features and Integrations',
      items: [
        {
          question: 'Can I integrate with GitHub?',
          answer: 'Yes! We support bidirectional GitHub sync, allowing you to push generated code to GitHub repositories and pull changes back to the platform. Each development request can create a separate git branch.',
        },
        {
          question: 'Do you support team collaboration?',
          answer: 'Yes, we offer team workspaces with collaborative editing (CRDT), shared projects, and role-based access control. Contact us for team and enterprise plans.',
        },
        {
          question: 'Can I import designs from Figma?',
          answer: 'Yes! Our Figma import feature can convert Figma designs directly into React components with accurate styling and layout.',
        },
        {
          question: 'What testing features are available?',
          answer: 'We provide AI-powered test generation (unit, integration, and E2E tests with Playwright), visual regression testing, and self-healing tests that automatically update when your UI changes.',
        },
      ],
    },
    {
      title: 'Support and Troubleshooting',
      items: [
        {
          question: 'How do I get help?',
          answer: (
            <>
              Multiple support channels are available:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Email: support@aidevrequest.com</li>
                <li>Support Board: <Link to="/support" className="text-accent-blue hover:underline">Platform Support</Link></li>
                <li>Documentation: Built-in help articles and guides</li>
                <li>Community: Feature suggestions and discussion forums</li>
              </ul>
            </>
          ),
        },
        {
          question: 'What are your support hours?',
          answer: 'Email support is available 24/7 with response times of 24-48 hours for standard plans. Pro and Enterprise plans receive priority support with faster response times.',
        },
        {
          question: 'My project build failed. What should I do?',
          answer: 'Check the build logs in your project detail page for error messages. Our self-healing system may automatically fix common issues. You can also use the refinement feature to request fixes or contact support with your project ID.',
        },
        {
          question: 'How do I report a bug?',
          answer: 'Please report bugs through our Support Board or email support@aidevrequest.com with details including steps to reproduce, expected vs actual behavior, and any error messages.',
        },
      ],
    },
  ]

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  let globalIndex = 0

  return (
    <div className="min-h-screen bg-warm-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-warm-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="w-10 h-10 text-accent-blue" />
          <h1 className="text-4xl font-bold gradient-text">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-8">
          {faqSections.map((section, sectionIdx) => (
            <section key={sectionIdx} className="space-y-4">
              <h2 className="text-2xl font-bold text-warm-100 border-b border-warm-800/50 pb-3">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => {
                  const currentIndex = globalIndex++
                  const isOpen = openIndex === currentIndex
                  return (
                    <div
                      key={currentIndex}
                      className="bg-warm-900/30 border border-warm-800/50 rounded-lg overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => toggleFaq(currentIndex)}
                        className="w-full px-6 py-4 flex items-start justify-between gap-4 text-left hover:bg-warm-800/20 transition-colors"
                      >
                        <span className="font-semibold text-warm-200">{item.question}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-warm-400 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-warm-400 leading-relaxed">
                          {typeof item.answer === 'string' ? item.answer : item.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-warm-100 mb-3">Still have questions?</h3>
          <p className="text-warm-400 mb-4">
            Can't find the answer you're looking for? Our support team is here to help!
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@aidevrequest.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-md transition-colors"
            >
              Contact Support
            </a>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 px-4 py-2 border border-warm-700 hover:border-warm-600 text-warm-200 rounded-md transition-colors"
            >
              Visit Support Board
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
