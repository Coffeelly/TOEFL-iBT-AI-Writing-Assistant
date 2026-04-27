// =============================================================================
// Database Seed — Writing Prompts
// =============================================================================
// Seeds the database with sample prompts for all modes × difficulties.
// Minimum 3 prompts per combination = 18 prompts total.
// Run: npx prisma db seed
// =============================================================================

import { PrismaClient, WritingMode, DifficultyLevel } from '../src/generated/prisma/client'

const prisma = new PrismaClient()

const prompts = [
  // ===========================================================================
  // EMAIL — BEGINNER (3)
  // ===========================================================================
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.BEGINNER,
    title: 'Surprise Birthday Party',
    scenarioText:
      'You are planning a surprise birthday party for your friend Emma. You need to buy decorations, order a cake, and invite guests, among other things. You are busy with school and would like your friend, John, to help you.\n\nWrite an email to John. In your email, do the following.\n\n• Explain why you need help.\n• Describe the tasks that you need help with.\n• Suggest a date and time to meet and discuss the party plans.\n\nWrite as much as you can and in complete sentences.',
  },
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.BEGINNER,
    title: 'Borrowing Class Notes',
    scenarioText:
      'You missed your English class last week because you were sick. Your classmate, Sarah, is known for taking very detailed notes. You would like to borrow her notes to study for the upcoming quiz.\n\nWrite an email to Sarah. In your email, do the following.\n\n• Explain why you were absent from class.\n• Ask if you can borrow or copy her notes.\n• Suggest a convenient time and place to meet.\n\nWrite as much as you can and in complete sentences.',
  },
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.BEGINNER,
    title: 'Joining a Study Group',
    scenarioText:
      'You have heard that some students in your class have formed a study group to prepare for final exams. You would like to join the group. You know one of the members, David, from a previous class.\n\nWrite an email to David. In your email, do the following.\n\n• Express your interest in joining the study group.\n• Explain why you think joining would be helpful for you.\n• Ask about the meeting schedule and what subjects the group covers.\n\nWrite as much as you can and in complete sentences.',
  },

  // ===========================================================================
  // EMAIL — INTERMEDIATE (3)
  // ===========================================================================
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.INTERMEDIATE,
    title: 'Requesting a Deadline Extension',
    scenarioText:
      'You are a university student. You have been working on a major research paper for your history class, but a family emergency last week prevented you from making enough progress. The paper is due this Friday and you need more time to complete it properly.\n\nWrite an email to your professor, Dr. Martinez. In your email, do the following.\n\n• Explain the situation that caused the delay.\n• Describe the progress you have made so far on the paper.\n• Request a specific extension and explain why that amount of time is necessary.\n\nWrite as much as you can and in complete sentences.',
  },
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.INTERMEDIATE,
    title: 'Reporting a Problem with Campus Housing',
    scenarioText:
      'You have been living in a university dormitory for two months. Recently, the heating system in your room stopped working properly, and the temperature has been uncomfortably cold, especially at night. You have already spoken to your floor resident advisor, but the problem has not been fixed after one week.\n\nWrite an email to the Campus Housing Office. In your email, do the following.\n\n• Describe the problem clearly, including when it started and what you have already done.\n• Explain how the situation is affecting your daily life and studies.\n• Request a specific action and state a reasonable deadline for the repair.\n\nWrite as much as you can and in complete sentences.',
  },
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.INTERMEDIATE,
    title: 'Organizing a Departmental Volunteer Event',
    scenarioText:
      'You are a student in the Biology department. You would like to organize a volunteer event where students help clean up a local nature reserve. You need support from the department to make this happen and want to contact the department coordinator, Ms. Chen.\n\nWrite an email to Ms. Chen. In your email, do the following.\n\n• Introduce your idea and explain why it would benefit both students and the community.\n• Describe the specific support or resources you are requesting from the department.\n• Propose a timeline and ask for a meeting to discuss the details further.\n\nWrite as much as you can and in complete sentences.',
  },

  // ===========================================================================
  // EMAIL — ADVANCED (3)
  // ===========================================================================
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.ADVANCED,
    title: 'Proposing a New Student Wellness Initiative',
    scenarioText:
      'You are the president of the Student Government Association at your university. Recent surveys show that a significant number of students report high levels of stress and anxiety, yet the campus counseling center has a three-week waiting list. You want to propose a peer-support wellness program to the Dean of Student Affairs, Dr. Thompson.\n\nWrite an email to Dr. Thompson. In your email, do the following.\n\n• Present the problem using specific evidence from the surveys.\n• Describe your proposed peer-support program in detail, including how it would be structured and staffed.\n• Address potential concerns the administration might have, such as cost or liability, and suggest solutions.\n\nWrite as much as you can and in complete sentences.',
  },
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.ADVANCED,
    title: 'Disputing a Grade on a Major Assignment',
    scenarioText:
      'You received a grade of 68% on your final research project in your Economics seminar. After carefully reviewing the grading rubric and the professor\'s comments, you believe that two sections of your paper were graded inconsistently with the stated criteria. You have evidence to support your position and want to request a formal grade review from Professor Williams.\n\nWrite an email to Professor Williams. In your email, do the following.\n\n• Clearly and respectfully state that you are requesting a grade review.\n• Identify the specific sections you believe were graded inconsistently and explain your reasoning with reference to the rubric.\n• Propose a constructive next step, such as a meeting, and express your commitment to understanding the feedback.\n\nWrite as much as you can and in complete sentences.',
  },
  {
    mode: WritingMode.EMAIL,
    difficulty: DifficultyLevel.ADVANCED,
    title: 'Recommending a Policy Change for International Students',
    scenarioText:
      'You are an international student who has identified a significant gap in your university\'s orientation program. New international students currently receive only a one-day orientation, which you believe is insufficient for helping them adapt to academic expectations, campus culture, and local life. You want to recommend a more comprehensive program to the Director of International Student Services, Dr. Patel.\n\nWrite an email to Dr. Patel. In your email, do the following.\n\n• Describe the specific shortcomings of the current orientation program based on your own experience and conversations with other students.\n• Propose a detailed alternative program, including its structure, duration, and key components.\n• Explain the benefits of your proposal for student retention and academic performance, and offer to assist with its development.\n\nWrite as much as you can and in complete sentences.',
  },

  // ===========================================================================
  // DISCUSSION — BEGINNER (3)
  // ===========================================================================
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.BEGINNER,
    title: 'Living On Campus vs. Off Campus',
    scenarioText:
      'Your professor is teaching a class on student life and university experience. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'This week we are discussing where students choose to live during their university years. Some students prefer to live on campus in dormitories, while others choose to rent apartments off campus. Both options have advantages and disadvantages. In your opinion, which living arrangement is better for university students, and why?',
    studentOpinionA:
      'I think living on campus is much better, especially in the first year. Everything you need — the library, classrooms, and the cafeteria — is right there. You also meet a lot of new people easily because you are surrounded by other students all the time. I made most of my close friends in my dormitory.',
    studentOpinionB:
      'I prefer living off campus because it gives you more freedom and privacy. You can cook your own food, choose your own schedule, and live more like an adult. Yes, you have to commute, but the independence is worth it. It also helps you develop important life skills like managing a budget.',
  },
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.BEGINNER,
    title: 'Working Part-Time While Studying',
    scenarioText:
      'Your professor is teaching a class on student life and personal development. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'Many university students choose to work part-time jobs while they are studying. Some people think this is a great way to gain experience and earn money. Others believe it takes too much time away from studying and can hurt academic performance. What is your opinion? Should university students work part-time jobs?',
    studentOpinionA:
      'I think working part-time is a good idea. It teaches you how to manage your time and gives you real work experience before you graduate. The money also helps pay for books and other expenses. As long as you do not work too many hours, it should not affect your grades too much.',
    studentOpinionB:
      'I disagree. University is already very demanding, and adding a job on top of that creates too much stress. Students should focus completely on their studies while they have the chance. There will be plenty of time to work after graduation. Scholarships and student loans exist for a reason.',
  },
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.BEGINNER,
    title: 'Printed Books vs. E-books',
    scenarioText:
      'Your professor is teaching a class on education and technology. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'Technology has changed the way we read. Today, students can choose between traditional printed textbooks and digital e-books on tablets or computers. Some students strongly prefer one over the other. Which do you prefer for studying — printed books or e-books — and what are your reasons?',
    studentOpinionA:
      'I prefer printed books because I can highlight and write notes directly on the pages. Reading on a screen for a long time hurts my eyes and makes it harder to concentrate. There is also something satisfying about holding a real book. I feel like I remember information better when I read it on paper.',
    studentOpinionB:
      'E-books are much more practical for me. I can carry hundreds of books on one device, which is much lighter than a heavy backpack full of textbooks. I can also search for keywords instantly and adjust the font size. They are usually cheaper too, which is important for students on a budget.',
  },

  // ===========================================================================
  // DISCUSSION — INTERMEDIATE (3)
  // ===========================================================================
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.INTERMEDIATE,
    title: 'Urbanization and Community Life',
    scenarioText:
      'Your professor is teaching a class on sociology. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'We\'ve been discussing the impact of urbanization, the process by which an increasing proportion of a population moves from rural areas to cities, often resulting in the expansion and development of urban centers. This shift can significantly reshape community life. Some sociologists argue that urbanization leads to the decline of close-knit communities and weakens social cohesion. Others, however, believe that urban environments foster new forms of social interaction and community building. What is your perspective on this issue?',
    studentOpinionA:
      'As cities grow, city residents often feel more isolated from each other. The fast-paced lifestyle and constant movement can make it hard to connect with neighbors or build lasting relationships. It\'s like everyone\'s busy doing their own thing, which makes forming a real sense of community more difficult.',
    studentOpinionB:
      'Cities offer tons of ways to meet people — through events, clubs, or just hanging out in public spaces. Urbanization brings together diverse groups, which can actually help build stronger, more inclusive communities. Even though it\'s busy, I think the variety and diversity of social opportunities in cities makes it easier for people to find their own sense of belonging.',
  },
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.INTERMEDIATE,
    title: 'The Role of Failure in Learning',
    scenarioText:
      'Your professor is teaching a class on educational psychology. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'This week we are examining the relationship between failure and learning. Some researchers argue that experiencing failure is an essential part of the learning process — it builds resilience, encourages deeper thinking, and leads to more meaningful understanding. Others contend that repeated failure can damage motivation and self-confidence, ultimately hindering progress. How do you view the role of failure in education? Is it a necessary and valuable experience, or is it something educators should work to minimize?',
    studentOpinionA:
      'I think failure is actually one of the best teachers. When I fail at something, I am forced to go back and figure out exactly where I went wrong, which leads to a much deeper understanding than if I had just gotten it right the first time. The discomfort of failing also motivates me to work harder. Without some failure, I do not think real learning happens.',
    studentOpinionB:
      'While I understand the argument, I think we romanticize failure too much. For many students, especially those who already lack confidence, repeated failure is discouraging and can cause them to give up entirely. Good teaching should be designed to guide students toward success, not set them up to fail. There are better ways to build resilience than letting students struggle unnecessarily.',
  },
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.INTERMEDIATE,
    title: 'Remote Work and Productivity',
    scenarioText:
      'Your professor is teaching a class on organizational behavior. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'The widespread adoption of remote work following the global pandemic has sparked ongoing debate among business leaders and researchers. Some argue that remote work increases employee productivity and satisfaction by offering greater flexibility and eliminating commute time. Others maintain that in-person collaboration is essential for creativity, team cohesion, and organizational culture. Based on what we have studied about motivation and workplace dynamics, what is your view on remote work as a long-term model for organizations?',
    studentOpinionA:
      'Remote work has been a huge productivity boost for me personally. Without the distractions of an open office and the time lost to commuting, I can focus much more deeply on my work. Research also shows that many employees report higher job satisfaction when they have flexibility. Companies that force everyone back to the office risk losing talented people who have come to value that autonomy.',
    studentOpinionB:
      'I think the benefits of remote work are overstated. A lot of the most important work in organizations happens through informal conversations and spontaneous collaboration — things that are very hard to replicate over video calls. New employees especially struggle to learn the culture and build relationships remotely. A hybrid model makes sense, but fully remote work weakens the social fabric that makes teams effective.',
  },

  // ===========================================================================
  // DISCUSSION — ADVANCED (3)
  // ===========================================================================
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.ADVANCED,
    title: 'Algorithmic Bias and Ethical Responsibility',
    scenarioText:
      'Your professor is teaching a class on technology ethics. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'We have been examining the ethical dimensions of artificial intelligence, particularly the problem of algorithmic bias — the tendency of AI systems to produce systematically unfair outcomes for certain groups, often reflecting biases present in training data. A central question in this debate is where responsibility lies. Some argue that the primary responsibility rests with the engineers and companies that design these systems. Others contend that broader regulatory frameworks and societal accountability are necessary. Who, in your view, bears the greatest responsibility for addressing algorithmic bias, and what concrete measures should they take?',
    studentOpinionA:
      'The responsibility lies squarely with the technology companies that build and profit from these systems. They have the technical expertise, the resources, and the direct control over the data and design choices that produce biased outcomes. Waiting for regulation is just an excuse to delay action. Companies should be required to conduct rigorous bias audits before deployment and be held legally liable when their systems cause demonstrable harm to individuals or communities.',
    studentOpinionB:
      'While companies certainly have obligations, I think placing all the responsibility on them is naive. Individual engineers often lack the power to override business decisions, and companies operate within the incentive structures that society and markets create. What we really need is robust government regulation that sets enforceable standards for fairness and transparency, combined with independent third-party auditing. Without systemic accountability, voluntary corporate responsibility will always be insufficient.',
  },
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.ADVANCED,
    title: 'Universal Basic Income as Economic Policy',
    scenarioText:
      'Your professor is teaching a class on macroeconomics and public policy. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'Universal Basic Income (UBI) — a policy in which the government provides every citizen with a regular, unconditional cash payment regardless of employment status — has gained renewed attention as automation threatens to displace large segments of the workforce. Proponents argue that UBI would reduce poverty, provide economic security in an era of job instability, and empower individuals to pursue education or entrepreneurship. Critics contend that it is fiscally unsustainable, would reduce the incentive to work, and fails to address the structural causes of inequality. Drawing on the economic concepts we have studied, evaluate the merits and limitations of UBI as a long-term policy solution.',
    studentOpinionA:
      'UBI represents a necessary evolution in how we think about the social contract. As automation accelerates, the assumption that full employment is achievable becomes increasingly untenable. A guaranteed income floor would not eliminate the incentive to work — pilot programs in Finland and Kenya have shown that recipients actually pursue more education and entrepreneurial activity, not less. The real question is not whether we can afford UBI, but whether we can afford the social costs of not having it as inequality continues to widen.',
    studentOpinionB:
      'The appeal of UBI is understandable, but the economic reality is far more complicated. Funding a meaningful UBI for an entire population would require either massive tax increases or cuts to targeted programs that currently serve the most vulnerable. There is also a serious risk of inflation if large amounts of new money enter the economy without a corresponding increase in productivity. Rather than a universal payment, I would argue for a more targeted expansion of earned income credits and investment in retraining programs that address the actual structural causes of displacement.',
  },
  {
    mode: WritingMode.DISCUSSION,
    difficulty: DifficultyLevel.ADVANCED,
    title: 'Biodiversity Conservation vs. Economic Development',
    scenarioText:
      'Your professor is teaching a class on environmental policy. Write a post responding to the professor\'s question.\n\nIn your response, you should do the following:\n\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\n\nAn effective response will contain at least 100 words.',
    professorPrompt:
      'One of the most persistent tensions in environmental policy is the conflict between biodiversity conservation and economic development, particularly in developing nations. Conservation advocates argue that protecting ecosystems and species is a moral imperative and a prerequisite for long-term human well-being, as biodiversity underpins the ecosystem services on which all economies depend. Development advocates counter that imposing conservation restrictions on poorer nations is a form of environmental colonialism that denies them the same path to prosperity that wealthier nations took. How should this tension be resolved? Who should bear the costs of global conservation efforts, and on what basis?',
    studentOpinionA:
      'The framing of conservation versus development is a false dichotomy that serves the interests of extractive industries. The evidence is overwhelming that intact ecosystems provide far greater long-term economic value — through carbon sequestration, water regulation, and sustainable resource use — than short-term exploitation. The real issue is that the costs of conservation fall on local communities while the benefits are global. The solution is not to abandon conservation but to create robust international funding mechanisms, like expanded carbon markets and biodiversity credits, that compensate developing nations fairly for the ecosystem services they preserve.',
    studentOpinionB:
      'While I support conservation in principle, I am deeply uncomfortable with the power dynamics at play. Wealthy nations industrialized by exploiting their natural resources and are now, in effect, telling developing nations they cannot do the same. Any serious conservation framework must begin by acknowledging this historical injustice. Beyond financial compensation, developing nations need genuine technology transfer and capacity building so they can pursue low-carbon development pathways. Conservation imposed without economic alternatives and without local community consent will always fail, because it asks the poorest people to bear the greatest sacrifice for a problem they did not create.',
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing prompts
  await prisma.submission.deleteMany()
  await prisma.prompt.deleteMany()

  // Insert all prompts
  for (const prompt of prompts) {
    await prisma.prompt.create({
      data: prompt,
    })
  }

  console.log(`✅ Seeded ${prompts.length} prompts successfully.`)

  // Log summary
  const emailCount = prompts.filter((p) => p.mode === WritingMode.EMAIL).length
  const discussionCount = prompts.filter((p) => p.mode === WritingMode.DISCUSSION).length
  console.log(`   📧 Email prompts: ${emailCount}`)
  console.log(`   💬 Discussion prompts: ${discussionCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
