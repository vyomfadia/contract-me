contractor/essential-services marketplace

We essentially want to build a platform that acts as a marketplace for contractors.

What contractors gain out of this platform:
Marketplace for work
Normal people sign up for a platform or call a number to interact with a voice agent who collects information on the problem.
Agent will then find the best person for the job, with the closest available time in their schedule.
Agent will then call the contractor and ask if they want to accept it.
Agent will then set things up if accepted
Agent will do necessary research into the problem and how easy it is to repair
Location-based issues
Items required
Where to get them
How much it will cost
Rough cost estimation of repair
Rough pricing to ask contractor given current rates, etc..
Gives price to user and they can accept

What people gain out of the platform:
They can just call the platform
They can just wait for someone to get back to them with information

MVP:
Page with a form for user to explain the issue
Launches an async task (through Redis?)
Calls OpenAI to see “what’s the problem here, extract structure, extract potential fixes (very brief), and expectations for equipment”
Uses customer history in memory as well, to assist if repeat problems, etc..
Saves result
The platform has a page where any authenticated contractor can see available jobs and take one if interested
The contractor can see equipment cost estimate and a rough price they should charge around.
They can suggest their own new pricing
The job becomes theirs. It gets scheduled in with at least a day before the appointment so they can go pick things up
The contractor then has a daily “calendar” with time marked in the morning for them to go pick things up - with a mega-shopping list aggregated for all their jobs of the day.
