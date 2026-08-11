import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, ThumbsUp, CheckCircle, RefreshCw } from 'lucide-react';
import { orderService, Order } from '../services/orderService';
import { feedbackService, FeedbackRequest, ProductFeedbackRequest } from '../services/feedbackService';

export default function Feedback() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [overallRating, setOverallRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState(true);
  
  // Product Reviews map
  const [productRatings, setProductRatings] = useState<Record<number, { rating: number; comment: string }>>({});

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const data = await orderService.getCustomerOrderDetails(id);
        setOrder(data);
        
        // Pre-fill products feedback defaults
        const defaults: Record<number, { rating: number; comment: string }> = {};
        data.items.forEach((item) => {
          defaults[item.id] = { rating: 5, comment: '' };
        });
        setProductRatings(defaults);
      } catch (e) {
        console.error('Failed to load order for reviews', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleProductRatingChange = (itemId: number, rating: number) => {
    setProductRatings(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating }
    }));
  };

  const handleProductCommentChange = (itemId: number, commentStr: string) => {
    setProductRatings(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment: commentStr }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSubmitting(true);
    try {
      // Assemble Request
      const productFeedbacksList: ProductFeedbackRequest[] = order.items.map((item) => ({
        productId: item.productId,
        orderItemId: item.id,
        rating: productRatings[item.id]?.rating || 5,
        comment: productRatings[item.id]?.comment || ''
      }));

      const feedbackRequest: FeedbackRequest = {
        orderId: order.id,
        overallRating,
        serviceRating,
        comment,
        recommend,
        productFeedbacks: productFeedbacksList
      };

      await feedbackService.submitFeedback(feedbackRequest);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data || 'Failed to submit feedback. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center">
        <span className="text-cafeflow-textMuted font-medium animate-pulse">Loading feedback dashboard...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex flex-col items-center justify-center p-4">
        <h2 className="font-serif text-2xl font-bold text-cafeflow-dark mb-2">Order details not found</h2>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-cafeflow-accent text-white rounded">Back to Menu</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center px-6 py-16">
        <div className="bg-cafeflow-card border-2 border-cafeflow-light/40 rounded-3xl p-10 md:p-14 max-w-lg w-full text-center space-y-8 shadow-xl">
          <div className="mx-auto w-24 h-24 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle className="w-14 h-14 stroke-[2.5]" />
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Thank You!</h1>
            <p className="text-cafeflow-textMuted text-base md:text-lg font-medium leading-relaxed">Your valuable feedback helps our baristas maintain artisanal quality & service excellence.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-cafeflow-accent text-white font-bold py-4 px-6 rounded-2xl hover:bg-cafeflow-dark transition-all text-lg shadow-lg hover:shadow-xl"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5: return "5/5 — Exceptional 🌟";
      case 4: return "4/5 — Very Good 👍";
      case 3: return "3/3 — Average 🙂";
      case 2: return "2/5 — Needs Improvement 😐";
      case 1: return "1/5 — Poor 😞";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text pb-24">
      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-24 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/track-order/${order.orderIdFormatted}`)}
            className="flex items-center gap-2 text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-7 h-7" /> Live Tracker
          </button>

          <span className="font-serif text-3xl md:text-4xl font-bold text-cafeflow-dark">Feedback & Reviews</span>
          <div className="w-8 h-8" />
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-10 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold text-cafeflow-accent uppercase tracking-widest">Share Your Experience</span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-cafeflow-dark">Feedback & Reviews</h1>
          <p className="text-cafeflow-textMuted text-base font-medium">Order Reference: <span className="font-bold text-cafeflow-dark">{order.orderIdFormatted}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Overall Experience (Enlarged) */}
          <div className="bg-cafeflow-card border-2 border-cafeflow-light/40 rounded-3xl p-8 md:p-10 shadow-lg space-y-8">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark border-b border-cafeflow-light/30 pb-4">Overall Experience</h3>
            
            <div className="space-y-8">
              {/* Overall Star selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base font-bold text-cafeflow-dark uppercase tracking-wider">Overall Experience</span>
                  <span className="text-xs md:text-sm font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {getRatingLabel(overallRating)}
                  </span>
                </div>
                <div className="flex gap-3 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star className={`w-9 h-9 md:w-11 md:h-11 ${star <= overallRating ? 'fill-current' : 'stroke-[1.5]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Star selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base font-bold text-cafeflow-dark uppercase tracking-wider">Service & Hospitality</span>
                  <span className="text-xs md:text-sm font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {getRatingLabel(serviceRating)}
                  </span>
                </div>
                <div className="flex gap-3 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setServiceRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star className={`w-9 h-9 md:w-11 md:h-11 ${star <= serviceRating ? 'fill-current' : 'stroke-[1.5]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text box */}
              <div className="space-y-3">
                <label htmlFor="overall-comment" className="text-sm font-bold text-cafeflow-dark uppercase tracking-wider block">Write Detailed Review</label>
                <textarea
                  id="overall-comment"
                  rows={4}
                  placeholder="Share details about coffee flavor, packaging quality, or barista timing..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-cafeflow-bg border border-cafeflow-light/60 rounded-2xl p-5 text-sm md:text-base font-medium focus:outline-none focus:border-cafeflow-accent focus:ring-2 focus:ring-cafeflow-accent/20 transition-all shadow-inner"
                />
              </div>

              {/* Recommendation checkbox */}
              <label className="flex items-center gap-4 cursor-pointer pt-2 bg-cafeflow-bg p-4 rounded-2xl border border-cafeflow-light/40">
                <input 
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="rounded border-cafeflow-light text-cafeflow-accent focus:ring-cafeflow-accent w-5 h-5"
                />
                <span className="text-sm md:text-base text-cafeflow-dark font-bold flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-cafeflow-cta" /> I would recommend CafeFlow to friends & family.
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Items specific reviews */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-cafeflow-textMuted">Review Ordered Items</h3>

            {order.items.map((item) => (
              <div key={item.id} className="bg-cafeflow-card border-2 border-cafeflow-light/40 rounded-3xl p-8 shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-serif font-bold text-xl md:text-2xl text-cafeflow-dark">{item.productName} × {item.quantity}</h4>
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-xs md:text-sm text-cafeflow-textMuted mt-1">
                        Customs: {item.customizations.map(c => c.customizationOptionName).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleProductRatingChange(item.id, star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-7 h-7 md:w-8 md:h-8 ${star <= (productRatings[item.id]?.rating || 5) ? 'fill-current' : 'stroke-[1.5]'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="Rate flavor intensity, temperature, or custom syrup ratio..."
                  value={productRatings[item.id]?.comment || ''}
                  onChange={(e) => handleProductCommentChange(item.id, e.target.value)}
                  rows={2}
                  className="w-full bg-cafeflow-bg border border-cafeflow-light/60 rounded-xl p-4 text-xs md:text-sm font-medium focus:outline-none focus:border-cafeflow-accent transition-all"
                />
              </div>
            ))}
          </div>

          {/* Submit Action (Enlarged) */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cafeflow-cta hover:bg-cafeflow-accent text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 text-lg md:text-xl"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" /> Submitting Your Review...
              </>
            ) : (
              'Submit Review & Experience'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
