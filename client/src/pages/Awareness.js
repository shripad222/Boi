import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Awareness = () => {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('schemes');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState(null);

  const categories = {
    schemes: 'Government Health Schemes',
    prevention: 'Disease Prevention',
    nutrition: 'Nutrition & Diet',
    maternal: 'Maternal Health',
    child: 'Child Health',
    elderly: 'Elderly Care'
  };

  const getLocalizedContent = (content) => {
    const localizedContent = {
      en: content,
      hi: {
        ...content,
        title: content.titleHi || content.title,
        content: content.contentHi || content.content,
        benefits: content.benefitsHi || content.benefits,
        eligibility: content.eligibilityHi || content.eligibility,
        howToApply: content.howToApplyHi || content.howToApply
      },
      mr: {
        ...content,
        title: content.titleMr || content.title,
        content: content.contentMr || content.content,
        benefits: content.benefitsMr || content.benefits,
        eligibility: content.eligibilityMr || content.eligibility,
        howToApply: content.howToApplyMr || content.howToApply
      }
    };
    
    return localizedContent[i18n.language] || localizedContent.en;
  };

  const awarenessContent = {
    schemes: [
      {
        title: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        titleHi: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
        titleMr: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
        content: 'The world\'s largest health insurance scheme providing coverage of Rs. 5 lakh per family per year for secondary and tertiary care hospitalization. Covers over 10 crore poor and vulnerable families.',
        contentHi: 'दुनिया की सबसे बड़ी स्वास्थ्य बीमा योजना जो द्वितीयक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष 5 लाख रुपये का कवरेज प्रदान करती है। 10 करोड़ से अधिक गरीब और कमजोर परिवारों को कवर करती है।',
        contentMr: 'जगातील सर्वात मोठी आरोग्य विमा योजना जी द्वितीयक आणि तृतीयक काळजी रुग्णालयात दाखल करण्यासाठी प्रति कुटुंब दरवर्षी 5 लाख रुपयांचे कव्हरेज प्रदान करते। 10 कोटींहून अधिक गरीब आणि असुरक्षित कुटुंबांना कव्हर करते.',
        benefits: ['Free treatment up to Rs. 5 lakh', 'Cashless treatment', 'Pre and post hospitalization coverage', 'No premium payment required'],
        benefitsHi: ['5 लाख रुपये तक मुफ्त इलाज', 'कैशलेस इलाज', 'अस्पताल में भर्ती से पहले और बाद का कवरेज', 'कोई प्रीमियम भुगतान आवश्यक नहीं'],
        benefitsMr: ['5 लाख रुपयांपर्यंत मोफत उपचार', 'कॅशलेस उपचार', 'रुग्णालयात दाखल होण्यापूर्वी आणि नंतरचे कव्हरेज', 'कोणतेही प्रीमियम पेमेंट आवश्यक नाही'],
        eligibility: 'Families identified through Socio-Economic Caste Census (SECC) 2011',
        eligibilityHi: 'सामाजिक-आर्थिक जाति जनगणना (SECC) 2011 के माध्यम से पहचाने गए परिवार',
        eligibilityMr: 'सामाजिक-आर्थिक जाती जनगणना (SECC) 2011 द्वारे ओळखलेली कुटुंबे',
        howToApply: 'Visit nearest Common Service Center (CSC) or hospital with Aadhaar card and ration card',
        howToApplyHi: 'आधार कार्ड और राशन कार्ड के साथ निकटतम कॉमन सर्विस सेंटर (CSC) या अस्पताल जाएं',
        howToApplyMr: 'आधार कार्ड आणि रेशन कार्डसह जवळच्या कॉमन सर्व्हिस सेंटर (CSC) किंवा रुग्णालयात भेट द्या'
      },
      {
        title: 'Janani Suraksha Yojana (JSY)',
        content: 'A safe motherhood intervention scheme to reduce maternal and neonatal mortality by promoting institutional delivery among poor pregnant women.',
        benefits: ['Cash assistance for institutional delivery', 'Free delivery services', 'Post-delivery care', 'Transportation support'],
        eligibility: 'Pregnant women belonging to BPL families',
        howToApply: 'Register at nearest Anganwadi Center or Primary Health Center'
      },
      {
        title: 'Rashtriya Swasthya Bima Yojana (RSBY)',
        content: 'Health insurance scheme for Below Poverty Line (BPL) families providing cashless insurance coverage.',
        benefits: ['Cashless treatment up to Rs. 30,000', 'Coverage for entire family', 'Pre-existing diseases covered', 'Maternity benefits'],
        eligibility: 'BPL families as per state BPL census',
        howToApply: 'Contact local insurance company or visit district collector office'
      }
    ],
    prevention: [
      {
        title: 'Hand Hygiene and Sanitation',
        content: 'Proper handwashing is one of the most effective ways to prevent the spread of diseases and infections.',
        tips: ['Wash hands for at least 20 seconds', 'Use soap and clean water', 'Wash before eating and after using toilet', 'Use alcohol-based sanitizer when soap is not available'],
        importance: 'Prevents diarrhea, respiratory infections, and other communicable diseases'
      },
      {
        title: 'Vaccination and Immunization',
        content: 'Vaccines protect against serious and potentially deadly diseases. Follow the immunization schedule for children and adults.',
        schedule: ['Birth: BCG, OPV, Hepatitis B', '6 weeks: DPT, OPV, Hepatitis B', '10 weeks: DPT, OPV', '14 weeks: DPT, OPV', '9 months: Measles'],
        importance: 'Prevents polio, measles, tuberculosis, hepatitis, and other vaccine-preventable diseases'
      }
    ],
    nutrition: [
      {
        title: 'Balanced Diet for Rural Families',
        content: 'A balanced diet includes all essential nutrients needed for good health and proper growth.',
        components: ['Cereals and millets (rice, wheat, jowar, bajra)', 'Pulses and legumes (dal, rajma, chana)', 'Vegetables (green leafy, colorful vegetables)', 'Fruits (seasonal and local)', 'Milk and dairy products', 'Oils and fats (in moderation)'],
        tips: ['Eat variety of foods', 'Include seasonal vegetables', 'Drink plenty of clean water', 'Limit sugar and salt intake']
      }
    ],
    maternal: [
      {
        title: 'Antenatal Care (ANC)',
        content: 'Regular checkups during pregnancy ensure the health of both mother and baby.',
        checkups: ['First visit: As soon as pregnancy is confirmed', 'Second visit: 14-26 weeks', 'Third visit: 28-36 weeks', 'Fourth visit: 36 weeks until delivery'],
        tests: ['Blood pressure monitoring', 'Weight gain tracking', 'Blood tests for anemia', 'Urine tests', 'Ultrasound scans'],
        importance: 'Early detection and prevention of complications during pregnancy'
      }
    ],
    child: [
      {
        title: 'Child Growth Monitoring',
        content: 'Regular monitoring of child\'s growth and development is crucial for early detection of malnutrition and developmental delays.',
        indicators: ['Weight for age', 'Height for age', 'Weight for height', 'Head circumference', 'Developmental milestones'],
        redFlags: ['Not gaining weight', 'Frequent infections', 'Delayed milestones', 'Loss of appetite', 'Unusual behavior']
      }
    ],
    elderly: [
      {
        title: 'Healthy Aging',
        content: 'Maintaining good health in old age requires attention to physical, mental, and social well-being.',
        tips: ['Regular health checkups', 'Stay physically active', 'Eat nutritious food', 'Take medications as prescribed', 'Stay socially connected', 'Mental stimulation through reading or games'],
        commonIssues: ['Diabetes management', 'Blood pressure control', 'Joint pain and mobility', 'Vision and hearing problems', 'Memory issues']
      }
    ]
  };

  const speakText = (text, forceLanguage = null) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      // Translate text if needed
      const translatedText = forceLanguage ? translateText(text, forceLanguage) : text;
      
      const utterance = new SpeechSynthesisUtterance(translatedText);
      
      // Set language based on current language or forced language
      const currentLang = forceLanguage || i18n.language;
      const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN'
      };
      utterance.lang = langMap[currentLang] || 'en-US';
      
      utterance.rate = 0.7; // Slower rate for better understanding in rural areas
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentSpeech(utterance);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentSpeech(null);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentSpeech(null);
        console.error('Speech synthesis error');
      };
      
      // Wait a bit for language change to take effect
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    } else {
      alert(t('awareness.speechNotSupported') || 'Text-to-speech is not supported in your browser');
    }
  };

  const translateText = (text, targetLang) => {
    // Simple translation mapping for key phrases
    const translations = {
      'hi': {
        'Government Health Schemes': 'सरकारी स्वास्थ्य योजनाएं',
        'Disease Prevention': 'रोग की रोकथाम',
        'Nutrition & Diet': 'पोषण और आहार',
        'Maternal Health': 'मातृ स्वास्थ्य',
        'Child Health': 'बाल स्वास्थ्य',
        'Elderly Care': 'बुजुर्गों की देखभाल',
        'Benefits': 'लाभ',
        'Eligibility': 'पात्रता',
        'How to Apply': 'आवेदन कैसे करें',
        'Emergency Services': 'आपातकालीन सेवाएं',
        'Health Helpline': 'स्वास्थ्य हेल्पलाइन'
      },
      'mr': {
        'Government Health Schemes': 'सरकारी आरोग्य योजना',
        'Disease Prevention': 'रोग प्रतिबंध',
        'Nutrition & Diet': 'पोषण आणि आहार',
        'Maternal Health': 'मातृ आरोग्य',
        'Child Health': 'बाल आरोग्य',
        'Elderly Care': 'वृद्धांची काळजी',
        'Benefits': 'फायदे',
        'Eligibility': 'पात्रता',
        'How to Apply': 'अर्ज कसा करावा',
        'Emergency Services': 'आपत्कालीन सेवा',
        'Health Helpline': 'आरोग्य हेल्पलाइन'
      }
    };

    if (translations[targetLang]) {
      let translatedText = text;
      Object.entries(translations[targetLang]).forEach(([english, translated]) => {
        translatedText = translatedText.replace(new RegExp(english, 'gi'), translated);
      });
      return translatedText;
    }
    
    return text;
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentSpeech(null);
    }
  };

  useEffect(() => {
    // Cleanup speech on component unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const renderContent = (item, index) => {
    const localizedItem = getLocalizedContent(item);
    const fullText = `${localizedItem.title}. ${localizedItem.content}. ${
      localizedItem.benefits ? `${t('awareness.benefits') || 'Benefits'}: ${localizedItem.benefits.join(', ')}.` : ''
    } ${
      localizedItem.tips ? `${t('awareness.tips') || 'Tips'}: ${localizedItem.tips.join(', ')}.` : ''
    } ${
      localizedItem.importance ? `${t('awareness.importance') || 'Importance'}: ${localizedItem.importance}` : ''
    }`;

    return (
      <div key={index} className="awareness-card">
        <div className="awareness-header">
          <h3>{localizedItem.title}</h3>
          <div className="audio-controls">
            <button
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => isPlaying ? stopSpeech() : speakText(fullText)}
              title={isPlaying ? t('awareness.stopAudio') || 'Stop Audio' : t('awareness.listenAudio') || 'Listen to this content'}
            >
              {isPlaying ? '⏹️ ' + (t('awareness.stop') || 'Stop') : '🔊 ' + (t('awareness.listen') || 'Listen')}
            </button>
          </div>
        </div>
        
        <p className="awareness-content">{localizedItem.content}</p>
        
        {localizedItem.benefits && (
          <div className="awareness-section">
            <h4>{t('awareness.benefits') || 'Benefits'}:</h4>
            <ul>
              {localizedItem.benefits.map((benefit, i) => (
                <li key={i}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}
        
        {localizedItem.tips && (
          <div className="awareness-section">
            <h4>{t('awareness.tips') || 'Tips'}:</h4>
            <ul>
              {localizedItem.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        
        {localizedItem.eligibility && (
          <div className="awareness-section">
            <h4>{t('awareness.eligibility') || 'Eligibility'}:</h4>
            <p>{localizedItem.eligibility}</p>
          </div>
        )}
        
        {localizedItem.howToApply && (
          <div className="awareness-section">
            <h4>{t('awareness.howToApply') || 'How to Apply'}:</h4>
            <p>{localizedItem.howToApply}</p>
          </div>
        )}
        
        {localizedItem.importance && (
          <div className="awareness-section">
            <h4>{t('awareness.importance') || 'Why Important'}:</h4>
            <p>{localizedItem.importance}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container awareness-page fade-in">
      <div className="page-header">
        <h1>Health Awareness & Government Schemes</h1>
        <p>Stay informed about healthcare schemes, prevention tips, and health awareness</p>
        
        {isPlaying && (
          <div className="audio-status">
            <span>🔊 Audio is playing...</span>
            <button className="btn btn-danger" onClick={stopSpeech}>
              Stop All Audio
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            className={`tab-button ${selectedCategory === key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="awareness-content-section">
        {awarenessContent[selectedCategory]?.map((item, index) => 
          renderContent(item, index)
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="emergency-section">
        <h2>Emergency Contacts</h2>
        <div className="emergency-grid">
          <div className="emergency-card">
            <h3>🚨 Emergency Services</h3>
            <p><strong>Dial: 108</strong></p>
            <p>24/7 Emergency ambulance service</p>
          </div>
          
          <div className="emergency-card">
            <h3>🏥 Health Helpline</h3>
            <p><strong>Dial: 104</strong></p>
            <p>National health helpline for medical advice</p>
          </div>
          
          <div className="emergency-card">
            <h3>👶 Child Helpline</h3>
            <p><strong>Dial: 1098</strong></p>
            <p>Child protection and emergency services</p>
          </div>
          
          <div className="emergency-card">
            <h3>👩 Women Helpline</h3>
            <p><strong>Dial: 181</strong></p>
            <p>Women in distress helpline</p>
          </div>
        </div>
      </div>

      {/* Audio Instructions */}
      <div className="audio-instructions">
        <h3>🔊 Audio Feature</h3>
        <p>Click the "Listen" button on any content card to hear the information read aloud. This feature works in multiple languages and is designed to help users who prefer audio content.</p>
        <div className="audio-tips">
          <h4>Tips for better audio experience:</h4>
          <ul>
            <li>Use headphones or speakers for better sound quality</li>
            <li>Ensure your device volume is at a comfortable level</li>
            <li>The audio will automatically stop when you navigate away</li>
            <li>You can stop audio anytime using the stop button</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Awareness;