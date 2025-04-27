import { VectorDocument } from "./embedding-utils";
import { nanoid } from "nanoid";

// Sample data from Macbeth for seeding the vector database
export const macbethData: VectorDocument[] = [
  {
    id: nanoid(),
    text: "Fair is foul, and foul is fair: Hover through the fog and filthy air.",
    metadata: {
      source: "Macbeth",
      act: "1",
      scene: "1",
      character: "Witches",
      theme: "Appearance vs. Reality",
    },
  },
  {
    id: nanoid(),
    text: "Look like the innocent flower, but be the serpent under it.",
    metadata: {
      source: "Macbeth",
      act: "1",
      scene: "5",
      character: "Lady Macbeth",
      theme: "Appearance vs. Reality",
    },
  },
  {
    id: nanoid(),
    text: "Is this a dagger which I see before me, The handle toward my hand? Come, let me clutch thee. I have thee not, and yet I see thee still. Art thou not, fatal vision, sensible To feeling as to sight? or art thou but A dagger of the mind, a false creation, Proceeding from the heat-oppressed brain?",
    metadata: {
      source: "Macbeth",
      act: "2",
      scene: "1",
      character: "Macbeth",
      theme: "Hallucinations",
    },
  },
  {
    id: nanoid(),
    text: "Out, damned spot! out, I say! One: two: why, then, 'tis time to do't. Hell is murky! Fie, my lord, fie! a soldier, and afeard? What need we fear who knows it, when none can call our power to account? Yet who would have thought the old man to have had so much blood in him.",
    metadata: {
      source: "Macbeth",
      act: "5",
      scene: "1",
      character: "Lady Macbeth",
      theme: "Guilt",
    },
  },
  {
    id: nanoid(),
    text: "Tomorrow, and tomorrow, and tomorrow, Creeps in this petty pace from day to day To the last syllable of recorded time, And all our yesterdays have lighted fools The way to dusty death. Out, out, brief candle! Life's but a walking shadow, a poor player That struts and frets his hour upon the stage And then is heard no more: it is a tale Told by an idiot, full of sound and fury, Signifying nothing.",
    metadata: {
      source: "Macbeth",
      act: "5",
      scene: "5",
      character: "Macbeth",
      theme: "Nihilism",
    },
  },
  {
    id: nanoid(),
    text: "By the pricking of my thumbs, Something wicked this way comes.",
    metadata: {
      source: "Macbeth",
      act: "4",
      scene: "1",
      character: "Second Witch",
      theme: "Foreshadowing",
    },
  },
  {
    id: nanoid(),
    text: "Double, double toil and trouble; Fire burn, and cauldron bubble.",
    metadata: {
      source: "Macbeth",
      act: "4",
      scene: "1",
      character: "Witches",
      theme: "Supernatural",
    },
  },
  {
    id: nanoid(),
    text: "The castle of Macduff I will surprise; Seize upon Fife; give to the edge o' the sword His wife, his babes, and all unfortunate souls That trace him in his line. No boasting like a fool; This deed I'll do before this purpose cool.",
    metadata: {
      source: "Macbeth",
      act: "4",
      scene: "1",
      character: "Macbeth",
      theme: "Revenge",
    },
  },
  {
    id: nanoid(),
    text: "I dare do all that may become a man; Who dares do more is none.",
    metadata: {
      source: "Macbeth",
      act: "1",
      scene: "7",
      character: "Macbeth",
      theme: "Manhood",
    },
  },
  {
    id: nanoid(),
    text: "Macbeth returns from a victorious battle and meets three witches who prophecize that he will become the Thane of Cawdor and eventually King of Scotland. Soon after, he learns that he has indeed been named Thane of Cawdor, which makes him believe the rest of the prophecy.",
    metadata: {
      source: "Macbeth",
      act: "1",
      scene: "3",
      character: "Plot Summary",
      theme: "Prophecy",
    },
  },
  {
    id: nanoid(),
    text: "Lady Macbeth urges her husband to kill King Duncan when he visits their castle. After initial hesitation, Macbeth murders the king and becomes the new ruler of Scotland, fulfilling the witches' prophecy.",
    metadata: {
      source: "Macbeth",
      act: "2",
      scene: "General",
      character: "Plot Summary",
      theme: "Ambition",
    },
  },
  {
    id: nanoid(),
    text: "Guilt plagues both Macbeth and Lady Macbeth. While Macbeth sees hallucinations, including Banquo's ghost, Lady Macbeth sleepwalks and tries to wash imaginary blood from her hands.",
    metadata: {
      source: "Macbeth",
      act: "General",
      scene: "General",
      character: "Analysis",
      theme: "Guilt",
    },
  },
  {
    id: nanoid(),
    text: "The witches give Macbeth three warnings: beware Macduff, no man born of woman can harm him, and he will not be defeated until Birnam Wood comes to Dunsinane Hill. These prophecies give Macbeth false confidence.",
    metadata: {
      source: "Macbeth",
      act: "4",
      scene: "1",
      character: "Plot Summary",
      theme: "Prophecy",
    },
  },
  {
    id: nanoid(),
    text: "In the end, Macduff reveals he was 'untimely ripped' from his mother's womb (C-section), and thus not technically 'born of woman'. He kills Macbeth in battle, fulfilling the witches' prophecy.",
    metadata: {
      source: "Macbeth",
      act: "5",
      scene: "8",
      character: "Plot Summary",
      theme: "Prophecy",
    },
  },
  {
    id: nanoid(),
    text: "The major themes in Macbeth include ambition, power, fate, supernatural, violence, guilt, and appearance versus reality. Shakespeare explores how unchecked ambition and the desire for power can corrupt individuals and lead to their downfall.",
    metadata: {
      source: "Macbeth",
      act: "General",
      scene: "General",
      character: "Analysis",
      theme: "Themes",
    },
  },
  {
    id: nanoid(),
    text: "Macbeth was likely written around 1606 during the reign of King James I, who was interested in witchcraft. The play is loosely based on historical events from Scottish history, particularly the reign of King Macbeth of Scotland in the 11th century.",
    metadata: {
      source: "Macbeth",
      act: "Historical Context",
      scene: "General",
      character: "Background",
      theme: "History",
    },
  },
  {
    id: nanoid(),
    text: "Lady Macbeth is one of Shakespeare's most famous female characters. She begins as strong, ambitious, and manipulative, pushing her husband to commit murder. However, she gradually descends into madness from guilt, ultimately taking her own life.",
    metadata: {
      source: "Macbeth",
      act: "Character Analysis",
      scene: "General",
      character: "Lady Macbeth",
      theme: "Character Development",
    },
  },
  {
    id: nanoid(),
    text: "The play explores the psychological effects of guilt through both Macbeth and Lady Macbeth. While Macbeth sees hallucinations like floating daggers and Banquo's ghost, Lady Macbeth's guilt manifests in her sleepwalking and obsessive hand-washing.",
    metadata: {
      source: "Macbeth",
      act: "Analysis",
      scene: "General",
      character: "Multiple",
      theme: "Psychology",
    },
  },
];

// Function to get sample Macbeth data
export function getMacbethSeedData(): VectorDocument[] {
  return macbethData;
}