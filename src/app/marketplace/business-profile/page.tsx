'use client';

import { useState } from 'react';
import { MY_BUSINESS_PROFILE, MARKETPLACE_DEALS } from '@/lib/mock-marketplace';
import { BusinessProfile, Product, BuyingNeed } from '@/types';
import {
    Star,
    MapPin,
    Phone,
    Mail,
    Globe,
    MessageSquare,
    Edit2,
    Plus,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Zap,
    ShieldCheck,
    Package,
    ShoppingCart,
    Image,
    Trash2,
    X,
    BadgeCheck,
    Award,
    Clock,
    TrendingUp,
    BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== HELPERS ====================

const TRUST_CONFIG = {
    1: { label: 'Registered', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: null },
    2: { label: 'Verified', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: BadgeCheck },
    3: { label: 'Trusted Seller', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: ShieldCheck },
    4: { label: 'Premium', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Award },
};

const BIZ_TYPE_LABELS: Record<string, string> = {
    manufacturer: 'ผู้ผลิต',
    service: 'ผู้ให้บริการ',
    agent: 'ตัวแทน',
    wholesale: 'ขายส่ง',
    retail: 'ขายปลีก',
};

const FREQ_LABELS: Record<string, string> = {
    regular: 'ประจำ',
    occasional: 'บางครั้ง',
    onetime: 'ครั้งเดียว',
};

const MATCH_POWER_ITEMS = [
    { label: 'ข้อมูลธุรกิจครบ', done: true, points: 20 },
    { label: '3 สินค้า/บริการ', done: true, points: 25 },
    { label: 'ราคา + MOQ ครบ', done: true, points: 15 },
    { label: 'ยืนยันตัวตนแล้ว', done: true, points: 10 },
    { label: 'ไม่มีรูป Portfolio', done: false, points: 12 },
    { label: 'ไม่ได้ระบุสิ่งที่ต้องการซื้อ', done: true, points: 8 },
    { label: 'ไม่มี English description', done: false, points: 5 },
    { label: 'ไม่มีเงื่อนไขชำระเงิน', done: false, points: 5 },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    className={cn('w-4 h-4', s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200')}
                />
            ))}
        </div>
    );
}

// ==================== MATCH POWER SCORE SECTION ====================

function MatchPowerSection({ score }: { score: number }) {
    const doneItems = MATCH_POWER_ITEMS.filter(i => i.done);
    const todoItems = MATCH_POWER_ITEMS.filter(i => !i.done);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-900">Match Power Score</h2>
                    </div>
                    <p className="text-xs text-gray-400">ยิ่งสูง ยิ่งได้รับ RFQ มากขึ้น</p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-bold text-gray-900">{score}</p>
                    <p className="text-xs text-gray-400">/ 100</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {doneItems.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{item.label}</span>
                        <span className="ml-auto text-xs font-medium text-green-600">+{item.points}%</span>
                    </div>
                ))}
                {todoItems.map(item => (
                    <div key={item.label} className="flex items-center gap-2 opacity-60">
                        {item.points >= 10
                            ? <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            : <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        }
                        <span className="text-xs text-gray-500">{item.label}</span>
                        <span className="ml-auto text-xs font-medium text-gray-400">+{item.points}%</span>
                    </div>
                ))}
            </div>

            {/* Tip */}
            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                <p className="text-xs text-blue-700 font-medium">
                    💡 เพิ่ม Portfolio → ได้ Deal เพิ่มขึ้น <span className="font-bold">30%</span>
                </p>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap ml-3">
                    เพิ่มตอนนี้ →
                </button>
            </div>
        </div>
    );
}

// ==================== PROFILE HEADER ====================

function ProfileHeader({ profile, editMode, onEdit }: {
    profile: BusinessProfile;
    editMode: boolean;
    onEdit: (field: keyof BusinessProfile, value: string) => void;
}) {
    const trust = TRUST_CONFIG[profile.trustLevel];
    const TrustIcon = trust.icon;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {profile.businessName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            {editMode ? (
                                <input
                                    className="text-xl font-semibold text-gray-900 border-b border-blue-400 focus:outline-none bg-transparent w-full mb-1"
                                    defaultValue={profile.businessName}
                                    onChange={e => onEdit('businessName', e.target.value)}
                                />
                            ) : (
                                <h1 className="text-xl font-semibold text-gray-900 mb-1">{profile.businessName}</h1>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                    {BIZ_TYPE_LABELS[profile.businessType]}
                                </span>
                                <span className={cn(
                                    'inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border',
                                    trust.color
                                )}>
                                    {TrustIcon && <TrustIcon className="w-3 h-3" />}
                                    {trust.label}
                                </span>
                                {profile.verified && (
                                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rating + Stats */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <StarRating rating={profile.rating} />
                            <span className="text-sm font-semibold text-gray-800">{profile.rating}</span>
                            <span className="text-xs text-gray-400">({profile.reviewCount} รีวิว)</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {editMode ? (
                                <input
                                    className="border-b border-blue-400 focus:outline-none bg-transparent text-xs"
                                    defaultValue={`${profile.district}, ${profile.province}`}
                                />
                            ) : (
                                <span>{profile.district}, {profile.province}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            สมาชิกตั้งแต่ {new Date(profile.memberSince).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="mt-4">
                {editMode ? (
                    <textarea
                        className="w-full text-sm text-gray-600 border border-blue-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed"
                        rows={3}
                        defaultValue={profile.description}
                        onChange={e => onEdit('description', e.target.value)}
                    />
                ) : (
                    <p className="text-sm text-gray-600 leading-relaxed">{profile.description}</p>
                )}
            </div>

            {/* Contact info */}
            <div className="mt-4 flex items-center gap-4 flex-wrap">
                {[
                    { icon: Phone, value: profile.contactPhone, href: `tel:${profile.contactPhone}` },
                    { icon: Mail, value: profile.contactEmail, href: `mailto:${profile.contactEmail}` },
                    { icon: MessageSquare, value: profile.lineId, href: '#' },
                    { icon: Globe, value: profile.website, href: `https://${profile.website}` },
                ].filter(c => c.value).map((contact, i) => (
                    <a
                        key={i}
                        href={contact.href}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <contact.icon className="w-3.5 h-3.5" />
                        {contact.value}
                    </a>
                ))}
            </div>

            {/* Performance stats */}
            <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
                {[
                    { label: 'Deal สำเร็จ', value: profile.dealsCompleted, color: 'text-green-600', icon: TrendingUp },
                    { label: 'ตอบสนอง', value: `${profile.responseRate}%`, color: 'text-blue-600', icon: BarChart2 },
                    { label: 'ตอบใน', value: profile.avgResponseTime, color: 'text-gray-900', icon: Clock },
                    { label: 'รีวิว', value: profile.reviewCount, color: 'text-amber-600', icon: Star },
                ].map(stat => (
                    <div key={stat.label} className="text-center">
                        <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== PRODUCTS SECTION ====================

function ProductsSection({ products, editMode, onAdd, onDelete }: {
    products: Product[];
    editMode: boolean;
    onAdd: () => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-400" />
                    <h2 className="text-base font-semibold text-gray-900">สินค้า / บริการ</h2>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{products.length}</span>
                </div>
                {editMode && (
                    <button onClick={onAdd} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มสินค้า/บริการ
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map(product => (
                    <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200 relative group">
                        {editMode && (
                            <button
                                onClick={() => onDelete(product.id)}
                                className="absolute top-2 right-2 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                            <Package className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{product.name}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{product.description}</p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">ราคาเริ่มต้น</span>
                                <span className="font-semibold text-gray-800">฿{product.startingPrice.toLocaleString()}</span>
                            </div>
                            {product.moq > 1 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">MOQ</span>
                                    <span className="text-gray-600">{product.moq.toLocaleString()} {product.moq === 1 ? 'ชิ้น' : product.tags.includes('รายเดือน') ? 'เดือน' : 'ชิ้น'}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">ระยะเวลา</span>
                                <span className="text-gray-600">{product.leadTime}</span>
                            </div>
                        </div>
                        {product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                                {product.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {editMode && (
                    <button
                        onClick={onAdd}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 min-h-[160px]"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="text-xs font-medium">เพิ่มสินค้า/บริการ</span>
                    </button>
                )}
            </div>
        </div>
    );
}

// ==================== BUYING NEEDS SECTION ====================

function BuyingNeedsSection({ needs, editMode, onAdd, onDelete }: {
    needs: BuyingNeed[];
    editMode: boolean;
    onAdd: () => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-gray-400" />
                    <h2 className="text-base font-semibold text-gray-900">สิ่งที่ต้องการซื้อ</h2>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{needs.length}</span>
                </div>
                {editMode && (
                    <button onClick={onAdd} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มสิ่งที่ต้องการ
                    </button>
                )}
            </div>
            <div className="space-y-3">
                {needs.map(need => (
                    <div key={need.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 group">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ShoppingCart className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-gray-800">{need.name}</p>
                                <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{need.category}</span>
                                <span className={cn(
                                    'text-[10px] rounded px-1.5 py-0.5 font-medium',
                                    need.frequency === 'regular' ? 'bg-green-50 text-green-600'
                                        : need.frequency === 'occasional' ? 'bg-amber-50 text-amber-600'
                                            : 'bg-gray-100 text-gray-500'
                                )}>
                                    {FREQ_LABELS[need.frequency]}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{need.description}</p>
                        </div>
                        {editMode && (
                            <button
                                onClick={() => onDelete(need.id)}
                                className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
                {editMode && (
                    <button
                        onClick={onAdd}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-xs font-medium text-gray-400 hover:text-blue-500 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มสิ่งที่ต้องการซื้อ
                    </button>
                )}
            </div>
        </div>
    );
}

// ==================== PORTFOLIO SECTION ====================

function PortfolioSection({ editMode }: { editMode: boolean }) {
    const placeholders = [1, 2, 3, 4, 5, 6];
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-gray-400" />
                    <h2 className="text-base font-semibold text-gray-900">Portfolio ผลงาน</h2>
                </div>
                {editMode && (
                    <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                        อัปโหลดรูป
                    </button>
                )}
            </div>
            <div className="grid grid-cols-3 gap-3">
                {placeholders.map(i => (
                    <div
                        key={i}
                        className={cn(
                            'aspect-video rounded-xl flex flex-col items-center justify-center transition-all duration-200',
                            editMode
                                ? 'border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                                : 'bg-gray-50 border border-gray-200'
                        )}
                    >
                        {editMode ? (
                            <>
                                <Plus className="w-5 h-5 text-gray-300 mb-1" />
                                <span className="text-xs text-gray-300">อัปโหลด</span>
                            </>
                        ) : (
                            <Image className="w-8 h-8 text-gray-300" />
                        )}
                    </div>
                ))}
            </div>
            {!editMode && (
                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700">ยังไม่มีรูป Portfolio — เพิ่มเพื่อเพิ่ม Match Power Score +12%</p>
                </div>
            )}
        </div>
    );
}

// ==================== REVIEWS SECTION ====================

function ReviewsSection() {
    const completedDeals = MARKETPLACE_DEALS.filter(d => d.status === 'completed' && d.buyerReview);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">รีวิวจาก Deal สำเร็จ</h2>
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{completedDeals.length}</span>
            </div>
            {completedDeals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <Star className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">ยังไม่มีรีวิว</p>
                    <p className="text-xs mt-1">ทำ Deal ให้สำเร็จเพื่อรับรีวิวแรก</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {completedDeals.map(deal => deal.buyerReview && (
                        <div key={deal.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500">B</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StarRating rating={deal.buyerReview.rating} />
                                        <span className="text-xs text-gray-400">
                                            {new Date(deal.buyerReview.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">"{deal.buyerReview.comment}"</p>
                                    <p className="text-xs text-gray-400 mt-1">จาก Deal: {deal.title}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== ADD PRODUCT MODAL ====================

function AddProductModal({ onClose, onSave }: { onClose: () => void; onSave: (product: Product) => void }) {
    const [form, setForm] = useState({ name: '', description: '', startingPrice: '', moq: '1', leadTime: '', tags: '' });

    const handleSave = () => {
        if (!form.name.trim()) return;
        onSave({
            id: `p-new-${Date.now()}`,
            name: form.name,
            description: form.description,
            startingPrice: parseInt(form.startingPrice) || 0,
            moq: parseInt(form.moq) || 1,
            leadTime: form.leadTime,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            images: [],
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">เพิ่มสินค้า/บริการ</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {[
                        { label: 'ชื่อสินค้า/บริการ *', key: 'name', placeholder: 'เช่น บริการออกแบบเว็บไซต์' },
                        { label: 'คำอธิบาย', key: 'description', placeholder: 'รายละเอียดบริการ...' },
                        { label: 'ราคาเริ่มต้น (฿)', key: 'startingPrice', placeholder: '15000' },
                        { label: 'MOQ (จำนวนขั้นต่ำ)', key: 'moq', placeholder: '1' },
                        { label: 'ระยะเวลาส่งมอบ', key: 'leadTime', placeholder: 'เช่น 14-21 วัน' },
                        { label: 'Tags (คั่นด้วยจุลภาค)', key: 'tags', placeholder: 'เช่น เว็บ, WordPress, SEO' },
                    ].map(field => (
                        <div key={field.key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">{field.label}</label>
                            <input
                                type="text"
                                placeholder={field.placeholder}
                                value={form[field.key as keyof typeof form]}
                                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">บันทึก</button>
                </div>
            </div>
        </div>
    );
}

// ==================== ADD BUYING NEED MODAL ====================

function AddBuyingNeedModal({ onClose, onSave }: { onClose: () => void; onSave: (need: BuyingNeed) => void }) {
    const [form, setForm] = useState({ name: '', category: '', description: '', frequency: 'regular' as BuyingNeed['frequency'] });

    const handleSave = () => {
        if (!form.name.trim()) return;
        onSave({ id: `bn-new-${Date.now()}`, ...form });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">เพิ่มสิ่งที่ต้องการซื้อ</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {[
                        { label: 'ชื่อสิ่งที่ต้องการ *', key: 'name', placeholder: 'เช่น ช่างภาพ Product' },
                        { label: 'หมวดหมู่', key: 'category', placeholder: 'เช่น ถ่ายภาพ/วิดีโอ' },
                        { label: 'คำอธิบายความต้องการ', key: 'description', placeholder: 'รายละเอียด...' },
                    ].map(field => (
                        <div key={field.key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">{field.label}</label>
                            <input
                                type="text"
                                placeholder={field.placeholder}
                                value={form[field.key as keyof typeof form] as string}
                                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">ความถี่ในการซื้อ</label>
                        <select
                            value={form.frequency}
                            onChange={e => setForm(f => ({ ...f, frequency: e.target.value as BuyingNeed['frequency'] }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="regular">ประจำ (รายเดือน/รายสัปดาห์)</option>
                            <option value="occasional">บางครั้ง</option>
                            <option value="onetime">ครั้งเดียว</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">บันทึก</button>
                </div>
            </div>
        </div>
    );
}

// ==================== MAIN PAGE ====================

export default function BusinessProfilePage() {
    const [editMode, setEditMode] = useState(false);
    const [profile, setProfile] = useState<BusinessProfile>(MY_BUSINESS_PROFILE);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAddNeed, setShowAddNeed] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleFieldEdit = (field: keyof BusinessProfile, value: string) => {
        setProfile(p => ({ ...p, [field]: value }));
    };

    const handleAddProduct = (product: Product) => {
        setProfile(p => ({ ...p, products: [...p.products, product] }));
    };

    const handleDeleteProduct = (id: string) => {
        setProfile(p => ({ ...p, products: p.products.filter(pr => pr.id !== id) }));
    };

    const handleAddNeed = (need: BuyingNeed) => {
        setProfile(p => ({ ...p, buyingNeeds: [...p.buyingNeeds, need] }));
    };

    const handleDeleteNeed = (id: string) => {
        setProfile(p => ({ ...p, buyingNeeds: p.buyingNeeds.filter(n => n.id !== id) }));
    };

    const handleSave = () => {
        setEditMode(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="max-w-3xl mx-auto py-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">โปรไฟล์ธุรกิจ</h1>
                    <p className="text-sm text-gray-500">หน้าตาของคุณในตลาด B2B — ยิ่งครบ ยิ่งได้ Deal</p>
                </div>
                <div className="flex items-center gap-2">
                    {saved && (
                        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            บันทึกแล้ว
                        </span>
                    )}
                    {editMode ? (
                        <>
                            <button
                                onClick={() => { setEditMode(false); setProfile(MY_BUSINESS_PROFILE); }}
                                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                บันทึกการเปลี่ยนแปลง
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            แก้ไขโปรไฟล์
                        </button>
                    )}
                </div>
            </div>

            {/* Edit mode banner */}
            {editMode && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
                    <Edit2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700 font-medium">โหมดแก้ไข — คลิกที่ข้อความเพื่อแก้ไข กด "บันทึก" เมื่อเสร็จสิ้น</p>
                </div>
            )}

            {/* Match Power Score */}
            <MatchPowerSection score={profile.matchPowerScore} />

            {/* Profile Header */}
            <ProfileHeader profile={profile} editMode={editMode} onEdit={handleFieldEdit} />

            {/* Products */}
            <ProductsSection
                products={profile.products}
                editMode={editMode}
                onAdd={() => setShowAddProduct(true)}
                onDelete={handleDeleteProduct}
            />

            {/* Buying Needs */}
            <BuyingNeedsSection
                needs={profile.buyingNeeds}
                editMode={editMode}
                onAdd={() => setShowAddNeed(true)}
                onDelete={handleDeleteNeed}
            />

            {/* Portfolio */}
            <PortfolioSection editMode={editMode} />

            {/* Reviews */}
            <ReviewsSection />

            {/* Modals */}
            {showAddProduct && (
                <AddProductModal onClose={() => setShowAddProduct(false)} onSave={handleAddProduct} />
            )}
            {showAddNeed && (
                <AddBuyingNeedModal onClose={() => setShowAddNeed(false)} onSave={handleAddNeed} />
            )}
        </div>
    );
}
