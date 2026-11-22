import type { Language } from './player-languages';

export type CryptoDepositCopy = {
  help: string;
  helpTitle: string;
  recommended: string;
  steps: string[];
  paymentLink: string;
  linkNote: string;
};

const ENGLISH_CRYPTO_COPY: CryptoDepositCopy = {
  help: 'Help',
  helpTitle: 'How to deposit with crypto',
  recommended: 'Recommended · In-app deposit',
  steps: [
    'Enter your amount in KES and choose the cryptocurrency and network you want to use.',
    'Tap Deposit. Wait for the payment address and exact crypto amount to appear.',
    'Send the exact amount to that address using the matching network. Include the memo or destination tag if one is shown.',
    'Keep this screen open while the payment is confirmed. You can also tap Check payment to refresh its status.',
    'Your balance updates after NOWPayments confirms the completed payment.',
  ],
  paymentLink: 'Use the NOWPayments payment link instead',
  linkNote: 'The in-app method is recommended because your payment is tracked here. If you use the external link, keep your payment receipt and contact Support if your balance does not update.',
};

export const CRYPTO_DEPOSIT_COPY: Record<Language, CryptoDepositCopy> = {
  en: ENGLISH_CRYPTO_COPY,
  fr: {
    help: 'Aide',
    helpTitle: 'Comment déposer en cryptomonnaie',
    recommended: 'Recommandé · Dépôt dans l’application',
    steps: [
      'Saisissez votre montant en KES et choisissez la cryptomonnaie et le réseau à utiliser.',
      'Touchez Dépôt. Attendez l’affichage de l’adresse de paiement et du montant exact en cryptomonnaie.',
      'Envoyez le montant exact à cette adresse via le réseau correspondant. Ajoutez le mémo ou le tag de destination s’il est indiqué.',
      'Gardez cet écran ouvert pendant la confirmation. Vous pouvez aussi toucher Vérifier le paiement pour actualiser le statut.',
      'Votre solde est mis à jour après confirmation du paiement par NOWPayments.',
    ],
    paymentLink: 'Utiliser plutôt le lien de paiement NOWPayments',
    linkNote: 'Le dépôt dans l’application est recommandé car votre paiement y est suivi. Si vous utilisez le lien externe, conservez votre reçu et contactez l’assistance si votre solde ne se met pas à jour.',
  },
  ar: {
    help: 'مساعدة',
    helpTitle: 'كيفية الإيداع بالعملات الرقمية',
    recommended: 'موصى به · الإيداع داخل التطبيق',
    steps: [
      'أدخل المبلغ بالشلن الكيني واختر العملة الرقمية والشبكة التي تريد استخدامها.',
      'اضغط على إيداع. انتظر حتى يظهر عنوان الدفع والمبلغ الدقيق بالعملة الرقمية.',
      'أرسل المبلغ الدقيق إلى ذلك العنوان باستخدام الشبكة المطابقة. أضف المذكرة أو علامة الوجهة إذا ظهرت.',
      'أبق هذه الشاشة مفتوحة أثناء تأكيد الدفع. يمكنك أيضاً الضغط على التحقق من الدفع لتحديث الحالة.',
      'يتم تحديث رصيدك بعد أن تؤكد NOWPayments اكتمال الدفع.',
    ],
    paymentLink: 'استخدم رابط الدفع NOWPayments بدلاً من ذلك',
    linkNote: 'يُنصح بالإيداع داخل التطبيق لأنه يتتبع دفعتك هنا. إذا استخدمت الرابط الخارجي، فاحتفظ بإيصال الدفع وتواصل مع الدعم إذا لم يتحدث رصيدك.',
  },
  pt: {
    help: 'Ajuda',
    helpTitle: 'Como depositar com criptomoeda',
    recommended: 'Recomendado · Depósito no aplicativo',
    steps: [
      'Digite o valor em KES e escolha a criptomoeda e a rede que deseja usar.',
      'Toque em Depositar. Aguarde o endereço de pagamento e o valor exato em criptomoeda aparecerem.',
      'Envie o valor exato para esse endereço usando a rede correspondente. Inclua o memo ou a tag de destino, se aparecer.',
      'Mantenha esta tela aberta durante a confirmação. Você também pode tocar em Verificar pagamento para atualizar o status.',
      'Seu saldo é atualizado depois que a NOWPayments confirma o pagamento concluído.',
    ],
    paymentLink: 'Usar o link de pagamento NOWPayments',
    linkNote: 'O método no aplicativo é recomendado porque seu pagamento é acompanhado aqui. Se usar o link externo, guarde o comprovante e contate o suporte se seu saldo não for atualizado.',
  },
  es: {
    help: 'Ayuda',
    helpTitle: 'Cómo depositar con criptomonedas',
    recommended: 'Recomendado · Depósito en la aplicación',
    steps: [
      'Ingresa el importe en KES y elige la criptomoneda y la red que quieres usar.',
      'Pulsa Depositar. Espera a que aparezcan la dirección de pago y el importe exacto en criptomonedas.',
      'Envía el importe exacto a esa dirección usando la red correspondiente. Incluye el memo o la etiqueta de destino si aparece.',
      'Mantén esta pantalla abierta mientras se confirma el pago. También puedes pulsar Comprobar pago para actualizar el estado.',
      'Tu saldo se actualiza cuando NOWPayments confirma el pago completado.',
    ],
    paymentLink: 'Usar el enlace de pago de NOWPayments',
    linkNote: 'Se recomienda el método de la aplicación porque tu pago se registra aquí. Si usas el enlace externo, guarda el comprobante y contacta con soporte si tu saldo no se actualiza.',
  },
  sw: {
    help: 'Msaada',
    helpTitle: 'Jinsi ya kuweka pesa kwa crypto',
    recommended: 'Inapendekezwa · Weka pesa ndani ya programu',
    steps: [
      'Weka kiasi chako kwa KES kisha chagua sarafu ya crypto na mtandao unaotaka kutumia.',
      'Gusa Weka pesa. Subiri anwani ya malipo na kiasi halisi cha crypto vionekane.',
      'Tuma kiasi halisi kwa anwani hiyo ukitumia mtandao unaolingana. Jumuisha memo au destination tag ikiwa imeonyeshwa.',
      'Acha skrini hii wazi malipo yanapothibitishwa. Unaweza pia kugusa Angalia malipo ili kusasisha hali.',
      'Salio lako linasasishwa NOWPayments inapothibitisha kuwa malipo yamekamilika.',
    ],
    paymentLink: 'Badala yake, tumia kiungo cha malipo cha NOWPayments',
    linkNote: 'Njia ya ndani ya programu inapendekezwa kwa sababu malipo yako yanafuatiliwa hapa. Ukitumia kiungo cha nje, weka risiti ya malipo na wasiliana na Msaada ikiwa salio lako halitasasishwa.',
  },
  hi: {
    help: 'मदद',
    helpTitle: 'क्रिप्टो से जमा कैसे करें',
    recommended: 'अनुशंसित · ऐप में जमा',
    steps: [
      'KES में राशि दर्ज करें और उपयोग करने वाली क्रिप्टोकरेंसी व नेटवर्क चुनें।',
      'जमा करें दबाएँ। भुगतान पता और सटीक क्रिप्टो राशि दिखने तक प्रतीक्षा करें।',
      'उसी नेटवर्क का उपयोग करके उस पते पर सटीक राशि भेजें। मेमो या डेस्टिनेशन टैग दिखे तो उसे शामिल करें।',
      'भुगतान की पुष्टि होने तक यह स्क्रीन खुली रखें। स्थिति अपडेट करने के लिए भुगतान जाँचें भी दबा सकते हैं।',
      'NOWPayments द्वारा पूरे भुगतान की पुष्टि होने के बाद आपका बैलेंस अपडेट होता है।',
    ],
    paymentLink: 'इसके बजाय NOWPayments भुगतान लिंक उपयोग करें',
    linkNote: 'ऐप में जमा की विधि अनुशंसित है क्योंकि आपका भुगतान यहीं ट्रैक होता है। बाहरी लिंक उपयोग करने पर रसीद रखें और बैलेंस अपडेट न होने पर सहायता से संपर्क करें।',
  },
  ur: {
    help: 'مدد',
    helpTitle: 'کرپٹو سے رقم جمع کرنے کا طریقہ',
    recommended: 'تجویز کردہ · ایپ میں رقم جمع کریں',
    steps: [
      'KES میں رقم درج کریں اور مطلوبہ کرپٹو کرنسی اور نیٹ ورک منتخب کریں۔',
      'رقم جمع کریں دبائیں۔ ادائیگی کا پتہ اور درست کرپٹو رقم ظاہر ہونے تک انتظار کریں۔',
      'مطابقہ نیٹ ورک استعمال کرتے ہوئے اس پتے پر درست رقم بھیجیں۔ میمو یا ڈیسٹینیشن ٹیگ دکھائی دے تو شامل کریں۔',
      'ادائیگی کی تصدیق کے دوران یہ اسکرین کھلی رکھیں۔ اسٹیٹس تازہ کرنے کے لیے ادائیگی چیک کریں بھی دبا سکتے ہیں۔',
      'NOWPayments کی مکمل ادائیگی کی تصدیق کے بعد آپ کا بیلنس اپڈیٹ ہوتا ہے۔',
    ],
    paymentLink: 'اس کے بجائے NOWPayments ادائیگی لنک استعمال کریں',
    linkNote: 'ایپ میں ادائیگی تجویز کی جاتی ہے کیونکہ آپ کی ادائیگی یہاں ٹریک ہوتی ہے۔ بیرونی لنک استعمال کریں تو رسید محفوظ رکھیں اور بیلنس اپڈیٹ نہ ہو تو سپورٹ سے رابطہ کریں۔',
  },
  am: {
    help: 'እርዳታ',
    helpTitle: 'በክሪፕቶ ገንዘብ እንዴት እንደሚያስገቡ',
    recommended: 'የሚመከር · በመተግበሪያው ውስጥ ገንዘብ ማስገቢያ',
    steps: [
      'መጠኑን በKES ያስገቡ እና ሊጠቀሙ የሚፈልጉትን ክሪፕቶ ምንዛሬ እና ኔትወርክ ይምረጡ።',
      'ገንዘብ አስገባ የሚለውን ይንኩ። የክፍያ አድራሻው እና ትክክለኛው የክሪፕቶ መጠን እስኪታይ ይጠብቁ።',
      'ትክክለኛውን መጠን በሚዛመደው ኔትወርክ ወደ ዚያ አድራሻ ይላኩ። ሜሞ ወይም destination tag ከታየ ያካትቱ።',
      'ክፍያው እስከሚረጋገጥ ይህን ማያ ገጽ ክፍት ያድርጉ። ሁኔታውን ለማደስ የክፍያ ማረጋገጫውንም መንካት ይችላሉ።',
      'NOWPayments ክፍያው እንደተጠናቀቀ ካረጋገጠች በኋላ ቀሪ ሂሳብዎ ይዘምናል።',
    ],
    paymentLink: 'በምትኩ የNOWPayments የክፍያ ሊንክ ይጠቀሙ',
    linkNote: 'ክፍያዎ እዚህ ስለሚከታተል በመተግበሪያው ውስጥ ያለው ዘዴ ይመከራል። ውጫዊውን ሊንክ ከተጠቀሙ ደረሰኝዎን ይያዙ፤ ቀሪ ሂሳብዎ ካልተዘመነ ድጋፍን ያግኙ።',
  },
  so: {
    help: 'Caawimo',
    helpTitle: 'Sida crypto loogu shubo',
    recommended: 'La kugula taliyay · Lacag dhigashada app-ka',
    steps: [
      'Geli qadarka KES kadib dooro crypto iyo shabakadda aad rabto inaad isticmaasho.',
      'Taabo Lacag dhig. Sug cinwaanka lacag bixinta iyo qadarka saxda ah ee crypto inay muuqdaan.',
      'U dir qadarka saxda ah cinwaankaas adoo isticmaalaya shabakadda u habboon. Ku dar memo ama destination tag haddii la muujiyo.',
      'Shaashaddan furan hayso inta lacagta la xaqiijinayo. Waxaad kale oo taabi kartaa Hubi lacagta si aad status-ka u cusubaysiiso.',
      'Haraagaagu wuu cusboonaadaa marka NOWPayments ay xaqiijiso in lacag bixintu dhammaatay.',
    ],
    paymentLink: 'Halkii ka sii isticmaal link-ga lacag bixinta NOWPayments',
    linkNote: 'Habka app-ka ayaa la kugula taliyay maxaa yeelay lacagtaada halkan ayaa la socdaa. Haddii aad isticmaasho link-ga dibadda, hayso rasiidka oo la xiriir Caawimada haddii haraagaagu uusan cusboonayn.',
  },
  mg: {
    help: 'Fanampiana',
    helpTitle: 'Ahoana ny fomba hametrahana vola crypto',
    recommended: 'Soso-kevitra · Fametrahana ao amin’ny app',
    steps: [
      'Ampidiro ny sandany amin’ny KES ary safidio ny crypto sy ny tambajotra tianao hampiasaina.',
      'Tsindrio ny Hametraka vola. Andraso hipoitra ny adiresy fandoavana sy ny sanda crypto marina.',
      'Alefaso any amin’io adiresy io ny sanda marina amin’ny tambajotra mifanaraka. Ampidiro ny memo na destination tag raha miseho.',
      'Aza akimpy ity efijery ity mandra-pamaritana ny fandoavana. Azafao koa tsindrio ny Hamarino ny fandoavana raha te havao ny satany.',
      'Havaozina ny vola tavela rehefa manamarina ny fandoavana vita NOWPayments.',
    ],
    paymentLink: 'Ampiasao fa tsy izany ny rohy fandoavana NOWPayments',
    linkNote: 'Soso-kevitra ny fomba ao amin’ny app satria arahi-maso eto ny fandoavanao. Raha mampiasa rohy ivelany ianao, tehirizo ny tapakila ary miantsoa ny Fanampiana raha tsy miova ny vola tavela.',
  },
  rw: {
    help: 'Ubufasha',
    helpTitle: 'Uko wohereza crypto',
    recommended: 'Byasabwa · Kohereza mu porogaramu',
    steps: [
        'Injiza amafaranga muri KES uhitemo crypto n’urusobe ushaka gukoresha.',
        'Kanda Bitsa. Tegereza aderesi yo kwishyura n’umubare nyawo wa crypto bigaragare.',
        'Ohereza umubare nyawo kuri iyo aderesi ukoresheje urusobe ruhuye. Ongeraho memo cyangwa destination tag niba bigaragara.',
        'Siga iyi mugaragaza ifunguye kwishyura bigacwa. Usabwa kandi kanda Reba ubwishyu kugira ngo uvugurure uko bimeze.',
        'Amafaranga asigaye avugururwa NOWPayments yemeje ko kwishyura byarangiye.',
    ],
    paymentLink: 'Ahubwo koresha linki yo kwishyura ya NOWPayments',
    linkNote: 'Uburyo bwo muri porogaramu nibwo busabwa kuko ubwishyu bwawe bikurikiranirwa hano. Niwakoresha linki yo hanze, bita inyemezabwishyu kandi uvugane n’Ubufasha amafaranga asigaye atavuguruwe.',
  },
  rn: {
    help: 'Ubufasha',
    helpTitle: 'Ingene ushirako crypto',
    recommended: 'Vyasabwe · Kushiramwo mu porogarama',
    steps: [
      'Injiza amafaranga muri KES uhitemwo crypto n’urubuga ushaka gukoresha.',
      'Fyonda Bika amahera. Rindira aderesi yo kuriha n’umubare nyawo wa crypto bigaragarire.',
      'Rungika umubare nyawo kuri iyo aderesi ukoresheje urubuga ruhuye. Injiza memo canke destination tag iyo bigaragarira.',
      'Siga iyi mugaragara yuguruye amahera agacwa. Ushobora no gukanda Suzuma kwishyura kugira uvugurure uko bimeze.',
      'Amafaranga asigaye avugururwa NOWPayments yemeje ko kwishyura kurangiye.',
    ],
    paymentLink: 'Ahubwo koresha link yo kuriha ya NOWPayments',
    linkNote: 'Uburyo bwo muri porogarama nibwo busabwa kuko kwishyura kwawe bikurikiranirwa hano. Niwakoresha link yo hanze, bibke inyemezo y’ukwishyura kandi uvugane n’Ubufasha amafaranga asigaye atavuguruwe.',
  },
  ti: {
    help: 'ሓገዝ',
    helpTitle: 'ብክሪፕቶ ገንዘብ ከምዝእትዉ',
    recommended: 'ዝመከር · ኣብ መተግበሪ ገንዘብ ምእታው',
    steps: [
      'መጠን ኣብ KES ኣእቱ ከምኡ’ውን ክትጥቀመሉ እትደልዮ ክሪፕቶን ኔትወርክን ምረጽ።',
      'ገንዘብ ኣእቱ ተጫወት። ናይ ክፍሊት ኣድራሻን ቅኑዕ መጠን ክሪፕቶን ክሳብ ዝረአ ደጊም።',
      'ቅኑዕ መጠን ናብቲ ኣድራሻ ብዝማዝም ኔትወርክ ስደድ። ሜሞ ወይ destination tag እንተሪኢኻ ኣእቱዮ።',
      'ክፍሊት ክሳብ ዝረጋገጽ እዚ ስክሪን ክፉት ኣቐምጦ። ኩነታት ንምሕዳስ ከምኡ’ውን ክፍሊት ምርመራ ክትጫወት ትኽእል።',
      'NOWPayments ዝተዛዘመ ክፍሊት ካብ ዘረጋገጸት ድሕሪኡ ቀሪ ሕሳብካ ይሓደስ።',
    ],
    paymentLink: 'በኽሊ ናይ NOWPayments ናይ ክፍሊት ሊንክ ተጠቐም',
    linkNote: 'ክፍሊትካ ኣብዚ ስለዝከታተል ኣብ መተግበሪ ዘሎ ሜላ ይመከር። ወጻኢ ሊንክ እንተ ተጠቂምካ ደረሰኝ ሓዝ፣ ቀሪ ሕሳብካ እንተ ዘይተሓደሰ ሓገዝ ርኸብ።',
  },
};
