import { ArrowLeft, ChevronDown, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FaqItem {
  question: string
  answer: string | React.ReactElement
}

export default function FaqPage() {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqSections: { title: string; items: FaqItem[] }[] = [
    {
      title: t('faq.section.0.title'),
      items: [
        {
          question: t('faq.section.0.q0.question'),
          answer: t('faq.section.0.q0.answer'),
        },
        {
          question: t('faq.section.0.q1.question'),
          answer: (
            <>
              {t('faq.section.0.q1.answerIntro')}
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>{t('faq.section.0.q1.step1')}</li>
                <li>{t('faq.section.0.q1.step2')}</li>
                <li>{t('faq.section.0.q1.step3')}</li>
                <li>{t('faq.section.0.q1.step4')}</li>
                <li>{t('faq.section.0.q1.step5')}</li>
              </ol>
            </>
          ),
        },
        {
          question: t('faq.section.0.q2.question'),
          answer: t('faq.section.0.q2.answer'),
        },
        {
          question: t('faq.section.0.q3.question'),
          answer: t('faq.section.0.q3.answer'),
        },
      ],
    },
    {
      title: t('faq.section.1.title'),
      items: [
        {
          question: t('faq.section.1.q0.question'),
          answer: t('faq.section.1.q0.answer'),
        },
        {
          question: t('faq.section.1.q1.question'),
          answer: t('faq.section.1.q1.answer'),
        },
        {
          question: t('faq.section.1.q2.question'),
          answer: t('faq.section.1.q2.answer'),
        },
        {
          question: t('faq.section.1.q3.question'),
          answer: t('faq.section.1.q3.answer'),
        },
      ],
    },
    {
      title: t('faq.section.2.title'),
      items: [
        {
          question: t('faq.section.2.q0.question'),
          answer: t('faq.section.2.q0.answer'),
        },
        {
          question: t('faq.section.2.q1.question'),
          answer: t('faq.section.2.q1.answer'),
        },
        {
          question: t('faq.section.2.q2.question'),
          answer: t('faq.section.2.q2.answer'),
        },
        {
          question: t('faq.section.2.q3.question'),
          answer: t('faq.section.2.q3.answer'),
        },
      ],
    },
    {
      title: t('faq.section.3.title'),
      items: [
        {
          question: t('faq.section.3.q0.question'),
          answer: t('faq.section.3.q0.answer'),
        },
        {
          question: t('faq.section.3.q1.question'),
          answer: t('faq.section.3.q1.answer'),
        },
        {
          question: t('faq.section.3.q2.question'),
          answer: t('faq.section.3.q2.answer'),
        },
        {
          question: t('faq.section.3.q3.question'),
          answer: t('faq.section.3.q3.answer'),
        },
      ],
    },
    {
      title: t('faq.section.4.title'),
      items: [
        {
          question: t('faq.section.4.q0.question'),
          answer: t('faq.section.4.q0.answer'),
        },
        {
          question: t('faq.section.4.q1.question'),
          answer: t('faq.section.4.q1.answer'),
        },
        {
          question: t('faq.section.4.q2.question'),
          answer: t('faq.section.4.q2.answer'),
        },
        {
          question: t('faq.section.4.q3.question'),
          answer: t('faq.section.4.q3.answer'),
        },
      ],
    },
    {
      title: t('faq.section.5.title'),
      items: [
        {
          question: t('faq.section.5.q0.question'),
          answer: t('faq.section.5.q0.answer'),
        },
        {
          question: t('faq.section.5.q1.question'),
          answer: t('faq.section.5.q1.answer'),
        },
        {
          question: t('faq.section.5.q2.question'),
          answer: t('faq.section.5.q2.answer'),
        },
        {
          question: t('faq.section.5.q3.question'),
          answer: t('faq.section.5.q3.answer'),
        },
      ],
    },
    {
      title: t('faq.section.6.title'),
      items: [
        {
          question: t('faq.section.6.q0.question'),
          answer: (
            <>
              {t('faq.section.6.q0.answerIntro')}
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t('faq.section.6.q0.channel1')}</li>
                <li>{t('faq.section.6.q0.channel2Prefix')}<Link to="/support" className="text-accent-blue hover:underline">{t('faq.section.6.q0.channel2')}</Link></li>
                <li>{t('faq.section.6.q0.channel3')}</li>
                <li>{t('faq.section.6.q0.channel4')}</li>
              </ul>
            </>
          ),
        },
        {
          question: t('faq.section.6.q1.question'),
          answer: t('faq.section.6.q1.answer'),
        },
        {
          question: t('faq.section.6.q2.question'),
          answer: t('faq.section.6.q2.answer'),
        },
        {
          question: t('faq.section.6.q3.question'),
          answer: t('faq.section.6.q3.answer'),
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
          {t('faq.backToHome')}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="w-10 h-10 text-accent-blue" />
          <h1 className="text-4xl font-bold gradient-text">{t('faq.title')}</h1>
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
          <h3 className="text-xl font-bold text-warm-100 mb-3">{t('faq.stillHaveQuestions')}</h3>
          <p className="text-warm-400 mb-4">
            {t('faq.stillHaveQuestionsDesc')}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@aidevrequest.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-md transition-colors"
            >
              {t('faq.contactSupport')}
            </a>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 px-4 py-2 border border-warm-700 hover:border-warm-600 text-warm-200 rounded-md transition-colors"
            >
              {t('faq.visitSupportBoard')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
