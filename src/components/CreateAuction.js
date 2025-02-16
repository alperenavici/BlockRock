import React, { useState } from 'react';
import { ethers } from 'ethers';

function CreateAuction({ contract, onAuctionCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    duration: '',
    isNFT: false,
    imageFile: null,
    imagePreview: null
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const uploadToIPFS = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`
        },
        body: formData
      });

      const data = await response.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (error) {
      console.error('IPFS yükleme hatası:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const price = ethers.utils.parseEther(formData.startingPrice);

      if (formData.isNFT) {
        if (!formData.imageFile) {
          alert('Lütfen bir NFT görseli seçin');
          return;
        }

        const imageURI = await uploadToIPFS(formData.imageFile);
        const metadata = {
          name: formData.title,
          description: formData.description,
          image: imageURI
        };

        const metadataURI = await uploadToIPFS(
          new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );

        const tx = await contract.createNFTAuction(
          formData.title,
          formData.description,
          price,
          parseInt(formData.duration),
          metadataURI
        );
        await tx.wait();
      } else {
        const tx = await contract.createAuction(
          formData.title,
          formData.description,
          price,
          parseInt(formData.duration)
        );
        await tx.wait();
      }

      onAuctionCreated();
      setFormData({
        title: '',
        description: '',
        startingPrice: '',
        duration: '',
        isNFT: false,
        imageFile: null,
        imagePreview: null
      });
    } catch (error) {
      console.error("Açık artırma oluşturma hatası:", error);
    }
  };

  return (
    <div className="create-auction">
      <h2 style={{fontWeight:"400"}}>Yeni Açık Artırma Oluştur</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label>
            <input
              type="checkbox"
              checked={formData.isNFT}
              onChange={(e) => setFormData({...formData, isNFT: e.target.checked})}
            />
            NFT Açık Artırması
          </label>
        </div>

        <input
          type="text"
          placeholder="Açık Artırma Başlığı"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
        
        <textarea
          placeholder="Açık Artırma Açıklaması"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />

        {formData.isNFT && (
          <div className="nft-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            {formData.imagePreview && (
              <img
                src={formData.imagePreview}
                alt="NFT Preview"
                className="nft-preview"
              />
            )}
          </div>
        )}

        <input
          type="number"
          step="0.01"
          placeholder="Başlangıç Fiyatı (ETH)"
          value={formData.startingPrice}
          onChange={(e) => setFormData({...formData, startingPrice: e.target.value})}
        />
        
        <input
          type="number"
          placeholder="Süre (Dakika)"
          value={formData.duration}
          onChange={(e) => setFormData({...formData, duration: e.target.value})}
        />
        
        <button 
          style={{width:"170px", padding:"16px 25px"}} 
          type="submit"
        >
          {formData.isNFT ? 'NFT Açık Artırması Oluştur' : 'Açık Artırma Oluştur'}
        </button>
      </form>
    </div>
  );
}

export default CreateAuction; 