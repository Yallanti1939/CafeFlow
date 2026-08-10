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
      <div className="min-h-screen bg-cafeflow-bg flex items-center justify-center px-6">
        <div className="bg-cafeflow-card border border-cafeflow-light/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold text-cafeflow-dark">Thank You!</h1>
            <p className="text-cafeflow-textMuted text-xs leading-relaxed">Your feedback helps our baristas maintain perfect standards.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-cafeflow-accent text-white font-semibold py-3.5 rounded-lg hover:bg-cafeflow-dark transition-all text-sm"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafeflow-bg text-cafeflow-text pb-20">
      {/* Header */}
      <header className="sticky top-0 z-45 bg-cafeflow-bg/95 backdrop-blur-md border-b border-cafeflow-light/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/track-order/${order.orderIdFormatted}`)}
            className="flex items-center gap-2 text-base md:text-lg font-bold text-cafeflow-dark hover:text-cafeflow-accent transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> Live Tracker
          </button>

          <span className="font-serif text-2xl md:text-3xl font-bold text-cafeflow-dark">Feedback & Reviews</span>
          <div className="w-8 h-8" />
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 mt-8">
        <div className="space-y-2 mb-6">
          <span className="text-[10px] font-bold text-cafeflow-accent uppercase tracking-widest">Share Experience</span>
          <h1 className="font-serif text-3xl font-bold text-cafeflow-dark">Feedback & Reviews</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Overall Experience */}
          <div className="bg-cafeflow-card border border-cafeflow-light/30 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="font-serif text-lg font-bold text-cafeflow-dark border-b border-cafeflow-light/20 pb-2">Overall Rating</h3>
            
            <div className="space-y-4">
              {/* Overall Star selection */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-cafeflow-textMuted uppercase tracking-wider">Overall Experience</span>
                <div className="flex gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-7 h-7 ${star <= overallRating ? 'fill-current' : 'stroke-[1.5]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Star selection */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-cafeflow-textMuted uppercase tracking-wider">Service Quality</span>
                <div className="flex gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setServiceRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-7 h-7 ${star <= serviceRating ? 'fill-current' : 'stroke-[1.5]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text box */}
              <div className="space-y-2">
                <label htmlFor="overall-comment" className="text-xs font-semibold text-cafeflow-textMuted uppercase tracking-wider">Write comments</label>
                <textarea
                  id="overall-comment"
                  rows={3}
                  placeholder="Share details about flavor profile, packaging, or timing..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-cafeflow-bg border border-cafeflow-light/60 rounded p-3 text-xs focus:outline-none focus:border-cafeflow-accent transition-all"
                />
              </div>

              {/* Recommendation checkbox */}
              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input 
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="rounded border-cafeflow-light text-cafeflow-accent focus:ring-cafeflow-accent w-4 h-4"
                />
                <span className="text-xs text-cafeflow-textMuted font-medium flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-cafeflow-cta" /> I would recommend CafeFlow to others.</span>
              </label>
            </div>
          </div>

          {/* Section 2: Items specific reviews */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cafeflow-textMuted">Review Ordered Items</h3>

            {order.items.map((item) => (
              <div key={item.id} className="bg-cafeflow-card border border-cafeflow-light/30 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-serif font-bold text-sm text-cafeflow-dark">{item.productName}</span>
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleProductRatingChange(item.id, star)}
                        className="p-0.5 hover:scale-105 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${star <= (productRatings[item.id]?.rating || 5) ? 'fill-current' : 'stroke-[1.5]'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="Rate flavor, temperature, or customization modifiers..."
                  value={productRatings[item.id]?.comment || ''}
                  onChange={(e) => handleProductCommentChange(item.id, e.target.value)}
                  rows={2}
                  className="w-full bg-cafeflow-bg border border-cafeflow-light/60 rounded p-2.5 text-xs focus:outline-none focus:border-cafeflow-accent transition-all"
                />
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cafeflow-cta text-white font-semibold py-4 rounded-lg shadow hover:bg-cafeflow-accent hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
