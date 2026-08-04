import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, MapPin, Send, ExternalLink, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { db, FarmInfo } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ContactMessage } from '../types';

export const ContactSection: React.FC = () => {
  const [farmInfo, setFarmInfo] = useState<FarmInfo>(() => db.getFarmInfo());

  useEffect(() => {
    const handleUpdate = () => setFarmInfo(db.getFarmInfo());
    window.addEventListener('farm_info_updated', handleUpdate);
    return () => window.removeEventListener('farm_info_updated', handleUpdate);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All 3 Farm Team Members (Recipients)
  const FARM_TEAM_RECIPIENTS = [
    {
      name: 'Neelam Ramachandraiah',
      role: 'Founder',
      mobile: '+91 9502756669',
      whatsappPhone: '919502756669',
      email: 'admin@farm.com'
    },
    {
      name: 'Neelam Subbaiah',
      role: 'Founder',
      mobile: '+91 8897288390',
      whatsappPhone: '918897288390',
      email: 'subbaiah@farm.com'
    },
    {
      name: 'Neelam Sreenivasulu',
      role: 'Digital Operator',
      mobile: '+91 9392589010',
      whatsappPhone: '919392589010',
      email: 'owner9392589010@farm.com'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitted(false);

    if (!formData.name.trim() || !formData.mobile.trim() || !formData.message.trim()) {
      setErrorMessage('Please complete all required fields (Full Name, Mobile Number, and Message).');
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionDate = new Date();
      const formattedDateTime = submissionDate.toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      }) + ' (IST)';

      // 1. Check logged in user for customer ID integration
      let loggedUserId: string | undefined = undefined;
      try {
        const storedUserJson = localStorage.getItem('lvf_current_user');
        if (storedUserJson) {
          const parsed = JSON.parse(storedUserJson);
          if (parsed && parsed.id) {
            loggedUserId = parsed.id;
          }
        }
      } catch (err) {
        console.error('Error reading current user for message submission:', err);
      }

      // 2. Save inquiry in local DB for instant admin dashboard availability
      const messages = db.getMessages();
      const newMessage: ContactMessage = {
        id: `msg-${Date.now()}`,
        customerId: loggedUserId,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        date: submissionDate.toISOString(),
        status: 'Unread',
        isRead: false
      };
      db.saveMessages([newMessage, ...messages]);

      // 2. Save inquiry in Supabase database table `contact_messages`
      if (isSupabaseConfigured) {
        try {
          const { error: dbError } = await supabase.from('contact_messages').insert([{
            name: formData.name.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email.trim() || null,
            subject: formData.subject,
            message: formData.message.trim(),
            status: 'New',
            created_at: submissionDate.toISOString()
          }]);
          if (dbError) {
            console.error('[Supabase DB Error] contact_messages insert failed:', dbError.message);
          }
        } catch (err) {
          console.error('[Supabase DB Error] Exception saving contact message:', err);
        }
      }

      // 3. Send notifications to all three team members simultaneously
      const dispatchPromises = FARM_TEAM_RECIPIENTS.map(async (recipient) => {
        try {
          const notificationPayload = {
            recipientName: recipient.name,
            recipientRole: recipient.role,
            recipientMobile: recipient.mobile,
            recipientEmail: recipient.email,
            fullName: formData.name.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email.trim() || 'Not provided',
            subject: formData.subject,
            message: formData.message.trim(),
            dateTime: formattedDateTime
          };

          if (isSupabaseConfigured) {
            const title = `Direct Message from ${formData.name.trim()}`;
            const notificationMessage = `Recipient: ${recipient.name} (${recipient.role})\nFull Name: ${formData.name.trim()}\nMobile: ${formData.mobile.trim()}\nEmail: ${formData.email.trim() || 'Not provided'}\nSubject: ${formData.subject}\nDate & Time: ${formattedDateTime}\nMessage: ${formData.message.trim()}`;

            const { error: notifError } = await supabase.from('notifications').insert([{
              title,
              message: notificationMessage,
              is_read: false,
              created_at: new Date().toISOString()
            }]);

            if (notifError) {
              console.error(`[Notification Error] Could not create notification for ${recipient.name}:`, notifError.message);
            }
          }
        } catch (err) {
          console.error(`[Notification Error] Failed dispatch for ${recipient.name}:`, err);
        }
      });
      await Promise.allSettled(dispatchPromises);

      // Display success confirmation message
      setSubmitted(true);
      setFormData({ name: '', mobile: '', email: '', subject: 'General Inquiry', message: '' });
      setTimeout(() => setSubmitted(false), 10000);

    } catch (err: any) {
      console.error('[Contact Form Error] Submission failed:', err);
      setErrorMessage(err?.message || 'Failed to submit direct message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-[#04140E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#062C1E] text-[#C5A059] border border-[#C5A059]/40 mb-3">
            <Phone className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" /> Direct Contact & Location
          </span>
          <h2 className="text-3xl font-serif-brand font-bold text-[#F2F2ED] tracking-tight sm:text-4xl">
            Get in Touch With Us
          </h2>
          <p className="mt-3 text-base text-emerald-200/80">
            Have questions about sheep breeds, country chicken availability, green grass fodder, or farm visits? Call us directly or message on WhatsApp!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Direct Phone, WhatsApp & Location */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#062C1E] text-[#F2F2ED] rounded-3xl p-8 shadow-2xl border border-[#C5A059]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-2xl"></div>
              
              <h3 className="text-2xl font-serif-brand font-bold mb-6 flex items-center gap-2 text-[#F2F2ED]">
                <Phone className="w-6 h-6 text-[#C5A059]" /> Farm Helpline
              </h3>

              <div className="space-y-4">
                <div className="bg-[#04140E]/80 p-5 rounded-2xl border border-[#C5A059]/40 shadow-inner">
                  <div className="text-[10px] uppercase tracking-widest font-black text-[#C5A059]">Primary Contact</div>
                  <div className="text-xl font-bold text-[#F2F2ED] mt-1">Neelam Ramachandraiah</div>
                  <a href="tel:+919502756669" className="text-2xl font-extrabold text-[#C5A059] mt-1 block hover:underline">
                    +91 9502756669
                  </a>
                  <p className="text-xs text-emerald-200/80 mt-1.5 leading-relaxed">
                    Direct inquiries, livestock orders (Jodipi Sheep & Natu Kolla), green fodder & farm bookings
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="tel:+919502756669"
                    id="btn-call-primary"
                    className="flex items-center justify-center px-4 py-3 bg-[#C5A059] hover:bg-[#b38f48] text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 mr-2" /> Call Primary
                  </a>
                  <a
                    href="https://wa.me/919502756669"
                    target="_blank"
                    rel="noreferrer"
                    id="btn-whatsapp-chat"
                    className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp Chat
                  </a>
                </div>
              </div>
            </div>

            {/* Google Maps Card */}
            <div className="dark-glass-card rounded-3xl p-6 border border-[#C5A059]/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#F2F2ED] font-serif-brand font-bold text-lg">
                  <MapPin className="w-5 h-5 text-[#C5A059]" /> Farm Location
                </div>
                <a
                  href={farmInfo.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  id="btn-google-maps-link"
                  className="inline-flex items-center text-xs font-bold text-[#C5A059] bg-[#062C1E] border border-[#C5A059]/40 px-3.5 py-1.5 rounded-xl hover:bg-[#C5A059] hover:text-slate-950 transition-all cursor-pointer shadow"
                >
                  View Farm Location <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </div>

              {/* Clickable Address Text */}
              <a
                href={farmInfo.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-100 hover:text-[#C5A059] font-semibold leading-relaxed mb-4 block hover:underline transition-colors"
                title="Click to view on Google Maps"
              >
                {farmInfo.farmName}, {farmInfo.address}
              </a>

              {/* Map View Frame */}
              <div className="w-full h-48 bg-[#062C1E]/60 rounded-2xl border border-[#C5A059]/30 relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
                <MapPin className="w-10 h-10 text-[#C5A059] animate-bounce mb-2" />
                <span className="text-sm font-bold text-[#F2F2ED]">{farmInfo.farmName} Location</span>
                <span className="text-xs text-emerald-200/60 mt-1">Tap below to open exact GPS location in Google Maps</span>
                <a
                  href={farmInfo.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  id="btn-contact-view-location"
                  className="mt-3 inline-flex items-center px-4 py-2 bg-[#C5A059] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow hover:bg-[#b38f48] transition-colors cursor-pointer"
                >
                  View Farm Location <ExternalLink className="w-3 h-3 ml-1.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Send Message Form */}
          <div className="lg:col-span-7 dark-glass-card rounded-3xl p-8 border border-[#C5A059]/20 shadow-xl">
            <h3 className="text-2xl font-serif-brand font-bold text-[#F2F2ED] mb-2">Send Us a Direct Message</h3>
            <p className="text-emerald-200/80 text-xs mb-6">
              Fill in your details below and our farm owners will get back to you shortly.
            </p>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-950/80 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-200 text-sm font-medium">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {submitted && (
              <div className="mb-6 p-4 bg-[#062C1E] border border-[#C5A059]/40 rounded-2xl flex items-center gap-3 text-[#C5A059] text-sm font-medium">
                <CheckCircle className="w-5 h-5 text-[#C5A059] flex-shrink-0" />
                Your message has been successfully sent to the Lakshmi Venkateshwara Sheep & Natu Kolla Farm management team. We will contact you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#C5A059] uppercase tracking-wider mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anjaneyulu Reddy"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-xl focus:ring-2 focus:ring-[#C5A059] text-[#F2F2ED] text-xs placeholder:text-emerald-200/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#C5A059] uppercase tracking-wider mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9392589010"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-xl focus:ring-2 focus:ring-[#C5A059] text-[#F2F2ED] text-xs placeholder:text-emerald-200/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#C5A059] uppercase tracking-wider mb-2">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-xl focus:ring-2 focus:ring-[#C5A059] text-[#F2F2ED] text-xs placeholder:text-emerald-200/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#C5A059] uppercase tracking-wider mb-2">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-xl focus:ring-2 focus:ring-[#C5A059] text-[#F2F2ED] text-xs"
                  >
                    <option value="General Inquiry" className="bg-[#04140E] text-white">General Farm Inquiry</option>
                    <option value="Sheep Purchase" className="bg-[#04140E] text-white">Local Sheep Purchase</option>
                    <option value="Natu Kolla Order" className="bg-[#04140E] text-white">Natu Kolla Chicken Order</option>
                    <option value="Green Grass Fodder" className="bg-[#04140E] text-white">Super Napier / Green Grass Fodder</option>
                    <option value="Farm Visit" className="bg-[#04140E] text-white">Schedule Farm Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#C5A059] uppercase tracking-wider mb-2">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your requirement (e.g., quantity needed, preferred visit date)..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-[#04140E] border border-[#C5A059]/30 rounded-xl focus:ring-2 focus:ring-[#C5A059] text-[#F2F2ED] text-xs placeholder:text-emerald-200/40"
                ></textarea>
              </div>

              <button
                type="submit"
                id="btn-submit-contact"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#C5A059] hover:bg-[#b38f48] disabled:opacity-50 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending to Team...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
