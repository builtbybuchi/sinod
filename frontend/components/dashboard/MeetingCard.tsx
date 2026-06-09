import React from 'react';
import { Meeting } from '../../types';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin: (id: string) => void;
  onSummarize: (id: string) => void;
  isSummarizing: boolean;
}

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.686-2.686l-1.938-.648 1.938-.648a3.375 3.375 0 002.686-2.686l.648-1.938.648 1.938a3.375 3.375 0 002.686 2.686l1.938.648-1.938.648a3.375 3.375 0 00-2.686 2.686z" />
  </svg>
);

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onJoin, onSummarize, isSummarizing }) => (
  <div className="bg-gray-800 rounded-lg p-5 flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-white">{meeting.title}</h3>
        {meeting.isPast && meeting.summary && <span className="text-xs font-medium bg-green-500/20 text-green-300 px-2 py-1 rounded-full">Summarized</span>}
        {meeting.isPast && !meeting.summary && <span className="text-xs font-medium bg-gray-600 text-gray-300 px-2 py-1 rounded-full">Ended</span>}
      </div>
      <p className="text-sm text-gray-400 mt-1">{meeting.time}</p>
      <p className="text-sm text-gray-400 mt-2">{meeting.attendees} attendees</p>
    </div>

    {meeting.isPast ? (
      <div>
        {meeting.summary ? (
          <div className="mt-4 p-4 bg-gray-900 rounded-md max-h-40 overflow-y-auto">
            <h4 className="font-semibold text-sm mb-2 text-blue-400">AI Summary</h4>
            <div className="prose prose-sm prose-invert text-gray-300" dangerouslySetInnerHTML={{ __html: meeting.summary.replace(/\n/g, '<br/>') }}></div>
          </div>
        ) : (
          <button
            onClick={() => onSummarize(meeting.id)}
            disabled={isSummarizing}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            {isSummarizing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <> <SparklesIcon className="w-4 h-4" /> Generate Summary </>
            )}
          </button>
        )}
      </div>
    ) : (
      <button onClick={() => onJoin(meeting.id)} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
        Join Now
      </button>
    )}
  </div>
);

export default MeetingCard;