hi, i need you to do me a fav... im goin to give you a series of pdfs that contain content such as assessment plan, module information and more. i need you to go through these documents and create a Module object that has the shape Module in the index.ts by extracting relevant data.

i already have mock data that was created with that Module shape

the id is just the module code with small letters im sure you've noticed.

im goin to give you different module data iteratively, meaning one by one. and each time you return the module data as one Module object that has everything it needs. do not make stuff up, if you dont know or cant see it in the documents, ask. at the end, tell me if you found all unullable and how many nullable and unullable did you not find. if the module doest cover the module and all. there may be  a few information that i may send that might not be pure pdf, some might contain images and some assessment plans i might give you as images. do you understand.

as i give you modules, stuff like color, being stuff that are not module specific are the stuff you can freestyle. i need some sense of randomness use the colors i used for the 4 modules to give you some direction. if you cannot find the maxScore, put in 100. the year is 2026. exam dates can be nullable since i dont have them as well as anything else if you dont find it.

my assessmentType is currently like this:
export type AssessmentType =
  | "weekly-test"
  | "class-test"
  | "semester-test"
  | "exam"
  | "assignment"
  | "online-test"
  | "attendance"
  | "aleks"
  | "class-work"
  | "practical"
  | "practical-exam"
  | "mcq";

this is the case because the 4 modules i gave me where my modules. the modules im about to give you belong to an entirely different fuculty. meaning they might have something else like practicals and what not.

change this shape how uever you see fit to accomodate different file assessment types.

as for color, as i give you modules, stuff like color you can freestyle. i need some sense of randomness use the colors i used for the 4 modules to give you some direction. if you cannot find the maxScore, put in 100. the year is 2026. exam dates can be nullable since i dont have them

always refer to the index.ts to create an accurate shape... for stuff we did not find, if their type is string and unullable just put ""...if a type is nullable and we dint find it... dont include it instead of writing undefined

do me a fav and check the semester dates of the 4 modules and see how they differ from each other... if they dont differ that much and dont deviate ... try using something close to those dates like 2026-07-17 to 2026-10-09 if we dont find any... normally these dates dont diviate that much